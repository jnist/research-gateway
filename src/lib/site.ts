import { assetPath } from './paths.js';

export const href = (path = '') => assetPath(import.meta.env.BASE_URL, path);
export const institution = {
  name: '济南超级计算技术研究院',
  english: 'Jinan Institute of Supercomputing Technology',
  website: 'https://www.jnist.cn/',
  repository: 'https://github.com/jnist/research-gateway',
};
