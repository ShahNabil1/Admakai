import { describe, expect, it } from 'vitest';
import { filterServicesByGoal, serviceGoals, toggleServiceGoal } from './service-goals';
import { services, visibleCategories } from './services';

describe('Service goal filtering', () => {
  it('defaults to all 37 published services', () => expect(filterServicesByGoal('all')).toHaveLength(37));
  it.each(serviceGoals.filter(goal => goal.id !== 'all'))('matches only $id membership', ({ id }) => {
    const expected = services.filter(service => service.published && service.goals.includes(id));
    expect(expected.length).toBeGreaterThan(0);
    expect(filterServicesByGoal(id).map(service => service.slug)).toEqual(expected.map(service => service.slug));
  });
  it('hides empty categories for festival', () => expect(visibleCategories(filterServicesByGoal('festival')).map(category => category.id)).toEqual(['video-ads', 'imagery']));
  it('resets when the active chip is clicked again', () => expect(toggleServiceGoal('sales', 'sales')).toBe('all'));
  it('resets when All services is clicked', () => expect(toggleServiceGoal('sales', 'all')).toBe('all'));
  it('replaces rather than combines active goals', () => expect(toggleServiceGoal('sales', 'tech')).toBe('tech'));
  it('never reveals unpublished matching services', () => {
    const source = services.map(service => ({ ...service, published: service.slug !== 'festival-campaign-pack' }));
    expect(filterServicesByGoal('festival', source).map(service => service.slug)).not.toContain('festival-campaign-pack');
    expect(filterServicesByGoal('all', source)).toHaveLength(36);
  });
});