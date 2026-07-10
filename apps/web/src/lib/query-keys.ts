export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  public: {
    homepage: ['public', 'homepage'] as const,
    club: ['public', 'club'] as const,
    actions: (page: number) => ['public', 'actions', page] as const,
    action: (slug: string) => ['public', 'action', slug] as const,
    news: (params: string) => ['public', 'news', params] as const,
    newsCategories: ['public', 'news-categories'] as const,
    newsArticle: (slug: string) => ['public', 'news-article', slug] as const,
    meetings: (params: string) => ['public', 'meetings', params] as const,
    meeting: (slug: string) => ['public', 'meeting', slug] as const,
    publicLibrary: (params: string) => ['public', 'library', params] as const,
    publicLibraryCategories: ['public', 'library-categories'] as const,
  },
  dashboard: {
    overview: ['dashboard', 'overview'] as const,
    profile: ['dashboard', 'profile'] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
    users: (page: number, q?: string) => ['admin', 'users', page, q] as const,
    user: (id: string) => ['admin', 'user', id] as const,
    roles: ['admin', 'roles'] as const,
    commissions: (page: number) => ['admin', 'commissions', page] as const,
    commission: (id: string) => ['admin', 'commission', id] as const,
    logs: (page: number, action?: string) => ['admin', 'logs', page, action] as const,
    moderationPosts: (page: number) => ['admin', 'moderation', 'posts', page] as const,
    moderationComments: (page: number) => ['admin', 'moderation', 'comments', page] as const,
    membershipApplications: (page: number, status?: string) =>
      ['admin', 'membership', page, status] as const,
    membershipApplication: (id: string) => ['admin', 'membership', id] as const,
    members: (page: number, q?: string, withoutAccount?: boolean) =>
      ['admin', 'members', page, q, withoutAccount] as const,
    member: (id: string) => ['admin', 'member', id] as const,
    actions: (params: string) => ['admin', 'actions', params] as const,
    action: (id: string) => ['admin', 'action', id] as const,
    news: (params: string) => ['admin', 'news', params] as const,
    newsArticle: (id: string) => ['admin', 'news-article', id] as const,
  },
  projects: {
    list: (params: string) => ['projects', 'list', params] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  feed: {
    list: (params: string) => ['feed', 'list', params] as const,
    detail: (id: string) => ['feed', 'detail', id] as const,
  },
  messaging: {
    list: ['messaging', 'list'] as const,
    detail: (id: string) => ['messaging', 'detail', id] as const,
    recipients: (q: string) => ['messaging', 'recipients', q] as const,
  },
  notifications: {
    lists: ['notifications', 'list'] as const,
    list: (page = 1, limit = 20) => ['notifications', 'list', page, limit] as const,
    counts: ['notifications', 'counts'] as const,
  },
  volunteering: {
    list: ['volunteering', 'list'] as const,
    stats: ['volunteering', 'stats'] as const,
    admin: ['volunteering', 'admin'] as const,
  },
  calendar: {
    range: (from: string) => ['calendar', 'range', from] as const,
    detail: (id: string) => ['calendar', 'detail', id] as const,
  },
  library: {
    categories: ['library', 'categories'] as const,
    list: (params: string) => ['library', 'list', params] as const,
  },
  search: {
    query: (q: string) => ['search', q] as const,
  },
} as const;
