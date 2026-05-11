import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()

  const { data: recipes } = await supabase
    .from('recipes')
    .select('slug, updated_at')
    .eq('published', true)

  const recipeUrls: MetadataRoute.Sitemap = (recipes ?? []).map((recipe) => ({
    url: `https://bydaria.kitchen/recipes/${recipe.slug}`,
    lastModified: new Date(recipe.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://bydaria.kitchen',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://bydaria.kitchen/recipes',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...recipeUrls,
  ]
}
