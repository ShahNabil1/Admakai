import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ meta: vi.fn(), update: vi.fn(), eq: vi.fn(), is: vi.fn(), select: vi.fn() }));
vi.mock('./vimeo', () => ({ getVimeoMeta: mocks.meta }));
vi.mock('./supabase', () => ({ supabase: { from: () => ({ update: mocks.update }) } }));
import { fetchMissingThumbnails } from './work-thumbnails';
beforeEach(() => {
  vi.clearAllMocks();
  const chain = { eq: mocks.eq, is: mocks.is, select: mocks.select };
  mocks.update.mockReturnValue(chain); mocks.eq.mockReturnValue(chain); mocks.is.mockReturnValue(chain); mocks.select.mockResolvedValue({ data: [{ id: 'a' }], error: null });
});
it('fetches only empty frames and guards writes against concurrent edits', async () => {
  mocks.meta.mockResolvedValue({ thumbnailUrl: 'https://frames.example/frame.jpg' });
  expect(await fetchMissingThumbnails([{id:'a',vimeo_id:'1',thumbnail_url:null},{id:'b',vimeo_id:'2',thumbnail_url:'https://frames.example/custom.jpg'},{id:'c',vimeo_id:'3',thumbnail_url:' '}])).toEqual({saved:2,failed:0,total:2});
  expect(mocks.meta.mock.calls).toEqual([['1'],['3']]);
  expect(mocks.is).toHaveBeenCalledWith('thumbnail_url',null);
  expect(mocks.eq).toHaveBeenCalledWith('thumbnail_url',' ');
});
it('never saves an unavailable or non-HTTPS frame', async () => {
  mocks.meta.mockResolvedValue({thumbnailUrl:'http://frames.example/frame.jpg'});
  expect(await fetchMissingThumbnails([{id:'a',vimeo_id:'1',thumbnail_url:null}])).toEqual({saved:0,failed:1,total:1});
  expect(mocks.update).not.toHaveBeenCalled();
});
it('reports a failed save instead of claiming success', async () => {
  mocks.meta.mockResolvedValue({thumbnailUrl:'https://frames.example/frame.jpg'});
  mocks.select.mockResolvedValue({data:[],error:{message:'permission denied'}});
  expect(await fetchMissingThumbnails([{id:'a',vimeo_id:'1',thumbnail_url:null}])).toEqual({saved:0,failed:1,total:1});
});