import json
import re
import urllib.parse

from yt_dlp.extractor.common import InfoExtractor
from yt_dlp.utils import (
    ExtractorError,
    int_or_none,
    traverse_obj,
    unified_timestamp,
)

# The public web preview endpoint. Verified working for both share-link shapes:
#   https://weixin.qq.com/sph/<shortUri>                       -> shortUri
#   https://channels.weixin.qq.com/finder-preview/pages/feed
#       ?eid=export/<exportId>&token=<t>&is_fallback=1          -> exportId
_API_URL = 'https://channels.weixin.qq.com/finder-preview/api/feed/get_feed_info'
_PAGE_URL = 'https://channels.weixin.qq.com/finder-preview/pages/sph'


class WeixinChannelsIE(InfoExtractor):
    IE_NAME = 'weixin:channels'
    _VALID_URL = (r'https?://(?:(?:www|channels)\.)?weixin\.qq\.com/'
                  r'(?:sph/[\w-]+|web/pages/feed\?|(?:finder-preview/)?pages/feed\?)')

    _TESTS = [{
        'url': 'https://weixin.qq.com/sph/A62FsejLCw',
        'only_matching': True,
    }, {
        'url': 'https://channels.weixin.qq.com/finder-preview/pages/feed?eid=export/UzFfBgAAxPyiZF8nbH7ek8zT4DCCJmJwVP6WwJUsSINoomZeFA&token=0&is_fallback=1',
        'only_matching': True,
    }]

    def _extract_query_id(self, url):
        """Return (field_name, id) for the two supported share-link shapes."""
        query = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
        short_uri = query.get('id', [None])[0]
        if short_uri:
            return 'shortUri', short_uri
        eid = (query.get('eid') or [None])[0]
        if eid:
            return 'exportId', eid
        path_match = re.search(r'/sph/(?P<id>[\w-]+)', url)
        if path_match:
            return 'shortUri', path_match.group('id')
        raise ExtractorError(
            'Unsupported 视频号 link, expected an id or eid parameter', expected=False)

    def _real_extract(self, url):
        field, value = self._extract_query_id(url)

        data = self._download_json(
            _API_URL, value,
            'Downloading feed info', 'Failed to download feed info',
            data=json.dumps({'baseReq': {'generalToken': ''}, field: value}).encode(),
            query={
                '_rid': 'yt-dlp',
                '_pageUrl': _PAGE_URL,
            },
            headers={
                'Content-Type': 'application/json',
                'Referer': _PAGE_URL,
                'Origin': 'https://channels.weixin.qq.com',
            },
            impersonate=True,
        )

        err = traverse_obj(data, ('data', 'errMsg', 'title', {str}))
        if err:
            raise ExtractorError(f'视频号 rejected this link: {err}', expected=True)

        feed = traverse_obj(data, ('data', 'feedInfo', {dict})) or {}
        author = traverse_obj(data, ('data', 'authorInfo', {dict})) or {}
        if not feed:
            raise ExtractorError('视频号 returned no feed data', expected=True)

        # Verified against the live API: the desktop web preview deliberately
        # withholds videoUrl / h264VideoInfo / h265VideoInfo. Only cover + metadata
        # are served, so there is nothing to download.
        video_url = traverse_obj(feed, ('videoUrl', {str}))
        if not video_url:
            raise ExtractorError(
                '视频号 does not expose the video stream to web clients. The preview '
                'API only returns cover and metadata, so the video can only be watched '
                'inside WeChat.',
                expected=True)

        return {
            'id': value,
            'title': feed.get('description') or value,
            'description': feed.get('description'),
            'thumbnail': feed.get('coverUrl'),
            'timestamp': unified_timestamp(feed.get('createtime')),
            'like_count': int_or_none(feed.get('likeCount')),
            'comment_count': int_or_none(feed.get('commentCount')),
            'uploader': author.get('nickname'),
            'formats': [{
                'format_id': 'video',
                'url': video_url,
                'ext': 'mp4',
            }],
        }