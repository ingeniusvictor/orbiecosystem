import { Router } from 'express';
import { ContentCategory } from '../../domain/common/enums';
import type { PublicNewsService } from './public-news-service';

const categoryValues = new Set(Object.values(ContentCategory));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createPublicNewsRouter = (service: PublicNewsService): Router => {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await service.listLatest());
  });

  router.get('/category/:category', async (req, res) => {
    const category = req.params.category?.toUpperCase() as ContentCategory;
    if (!categoryValues.has(category)) {
      res.status(404).json({ error: 'NEWS_CATEGORY_NOT_FOUND' });
      return;
    }

    res.json(await service.listByCategory(category));
  });

  router.get('/:slug', async (req, res) => {
    const slug = req.params.slug ?? '';
    if (!slugPattern.test(slug)) {
      res.status(404).json({ error: 'NEWS_ARTICLE_NOT_FOUND' });
      return;
    }

    const article = await service.findBySlug(slug);
    if (!article) {
      res.status(404).json({ error: 'NEWS_ARTICLE_NOT_FOUND' });
      return;
    }

    res.json(article);
  });

  return router;
};
