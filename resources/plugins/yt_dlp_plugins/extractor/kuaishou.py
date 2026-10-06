import hashlib
import json
import os
import re
import time

from yt_dlp.extractor.common import InfoExtractor
from yt_dlp.utils import (
    ExtractorError,
    int_or_none,
    traverse_obj,
    unified_timestamp,
)


def _stable_did():
    """Build a stable per-machine device id.

    A fresh id on every run trips Kuaishou's risk control, so derive it
    deterministically rather than at random.
    """
    seed = '|'.join((
        os.environ.get('USERPROFILE') or os.environ.get('HOME') or '',
        os.environ.get('COMPUTERNAME') or '',
    ))
    return f'web_{hashlib.sha256(seed.encode()).hexdigest()[:32]}'


class KuaishouIE(InfoExtractor):
    IE_NAME = 'kuaishou'
    # short-video links carry the photo id directly; v.kuaishou.com links are short
    # codes that redirect to .../long-video/<photoId>
    _VALID_URL = r'https?://(?:(?:www\.)?kuaishou\.com/short-video/|v\.kuaishou\.com/)(?P<id>[\w-]+)'
    _SHARE_URL_RE = r'https?://v\.kuaishou\.com/'

    _TESTS = [{
        'url': 'https://www.kuaishou.com/short-video/3x8abcz9dqz8ykw',
        'only_matching': True,
    }, {
        'url': 'https://v.kuaishou.com/abcdef',
        'only_matching': True,
    }]

    _GRAPHQL = '''
        query visionVideoDetail($photoId: String, $page: String) {
          visionVideoDetail(photoId: $photoId, page: $page) {
            status
            photo {
              id
              caption
              duration
              likeCount
              viewCount
              coverUrl
              photoUrl
              timestamp
              author { id name }
              manifest {
                adaptationSet {
                  representation {
                    id
                    url
                    width
                    height
                    qualityType
                    avgBitrate
                  }
                }
              }
            }
          }
        }
    '''

    def _resolve_id(self, url, video_id):
        """v.kuaishou.com/<code> 302s to a page that carries the real photo id"""
        if not re.match(self._SHARE_URL_RE, url):
            return video_id
        webpage = self._download_webpage(
            url, video_id, note=False, impersonate=True, fatal=False)
        return self._search_regex(
            r'/long-video/([\w-]+)', webpage or '', 'video id',
            default=video_id, fatal=False)

    def _real_extract(self, url):
        video_id = self._resolve_id(url, self._match_id(url))

        cookies = {
            'did': _stable_did(),
            'didv': str(int(time.time() * 1000)),
            'kpf': 'PC_WEB',
            'clientid': '3',
            'kpn': 'KUBERNETES',
        }
        for name, value in cookies.items():
            self._set_cookie('.kuaishou.com', name, value)

        data = self._download_json(
            'https://www.kuaishou.com/graphql', video_id,
            'Downloading video JSON', 'Failed to download video JSON',
            data=json.dumps({
                'operationName': 'visionVideoDetail',
                'variables': {'photoId': video_id, 'page': 'search'},
                'query': self._GRAPHQL,
            }).encode(),
            headers={
                'Content-Type': 'application/json',
                'Referer': 'https://www.kuaishou.com/',
                'Origin': 'https://www.kuaishou.com',
            },
            impersonate=True,
        )

        # Kuaishou signals risk control in three different shapes depending on which
        # layer rejects the request, so check all of them before giving up:
        #   {"errors":[{"message":"Need captcha"}]}
        #   {"data":{"result":400002,"captcha":{...}}}
        #   {"result":2,"error_msg":null}
        error = traverse_obj(data, ('errors', 0, 'message', {str}))
        captcha = traverse_obj(data, (('data', 'captcha'), ('captcha',)), {dict})
        result_code = traverse_obj(data, (('data', 'result'), ('result',)), {int_or_none})

        if error or captcha or result_code is not None:
            detail = error or traverse_obj(data, (('data', 'errMsg'), ('errMsg',)), {str})
            if captcha or (error and 'captcha' in error.lower()) or result_code is not None:
                code = f' (code {result_code})' if result_code is not None else ''
                raise ExtractorError(
                    f'Kuaishou risk control blocked this request{code}. Retry from a '
                    f'different network, or log in via 设置 → 平台登录'
                    + (f'. Detail: {detail}' if detail else ''),
                    expected=True)
            raise ExtractorError(f'Kuaishou API error: {detail}', expected=True)

        photo = traverse_obj(data, ('data', 'visionVideoDetail', 'photo', {dict})) or {}
        if not photo:
            raise ExtractorError('Kuaishou returned no video data', expected=True)

        formats = [{
            'format_id': f'{int_or_none(rep.get("qualityType")) or i}-{rep.get("id") or i}',
            'url': rep['url'],
            'width': int_or_none(rep.get('width')),
            'height': int_or_none(rep.get('height')),
            'tbr': int_or_none(rep.get('avgBitrate')),
            'ext': 'mp4',
            'protocol': 'https',
        } for i, rep in enumerate(
            traverse_obj(photo, ('manifest', 'adaptationSet', ..., 'representation', ...)))
            if rep.get('url')]

        if not formats and photo.get('photoUrl'):
            formats.append({
                'format_id': 'photoUrl',
                'url': photo['photoUrl'],
                'ext': 'mp4',
                'protocol': 'https',
            })

        if not formats:
            raise ExtractorError('Kuaishou returned no playable media URL', expected=True)

        return {
            'id': photo.get('id') or video_id,
            'title': photo.get('caption') or video_id,
            'description': photo.get('caption'),
            'duration': int_or_none(photo.get('duration')),
            'thumbnail': photo.get('coverUrl'),
            'timestamp': unified_timestamp(photo.get('timestamp')),
            'view_count': int_or_none(photo.get('viewCount')),
            'like_count': int_or_none(photo.get('likeCount')),
            'uploader': traverse_obj(photo, ('author', 'name', {str})),
            'uploader_id': traverse_obj(photo, ('author', 'id', {str})),
            'formats': formats,
        }