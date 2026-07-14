import { Injectable } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ClubProfile, MeetingSummary } from '@rotary/shared-types';

@Injectable()
export class ClubService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(): Promise<ClubProfile | null> {
    const profile = await this.prisma.clubProfile.findUnique({
      where: { id: 'club-profile' },
    });

    if (!profile) return null;

    const [executive, commissions, gallery, timeline, socialLinks] = await Promise.all([
      this.prisma.executiveMember.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.commission.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.galleryImage.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.clubTimelineEvent.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.socialLink.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    return {
      history: profile.history,
      vision: profile.vision,
      mission: profile.mission,
      values: this.parseStringArray(profile.values),
      organization: profile.organization,
      presidentMessage: profile.presidentMessage,
      presidentName: profile.presidentName,
      presidentTitle: profile.presidentTitle,
      presidentPhoto: profile.presidentPhoto,
      riPresidentName: profile.riPresidentName,
      riPresidentTitle: profile.riPresidentTitle,
      riPresidentBio: profile.riPresidentBio,
      riPresidentMessage: profile.riPresidentMessage,
      riPresidentPhoto: profile.riPresidentPhoto,
      executive: executive.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        photo: m.photo,
        bio: m.bio,
      })),
      commissions: commissions.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
      })),
      gallery: gallery.map((g) => ({
        id: g.id,
        url: g.url,
        caption: g.caption,
      })),
      timeline: timeline.map((event) => ({
        id: event.id,
        year: event.year,
        title: event.title,
        description: event.description,
        imageUrl: event.imageUrl,
        highlight: event.highlight,
      })),
      socialLinks: socialLinks.map((s) => ({
        id: s.id,
        platform: s.platform,
        url: s.url,
      })),
    };
  }

  async getUpcomingMeetings(limit = 3): Promise<MeetingSummary[]> {
    const now = new Date();
    const items = await this.prisma.meeting.findMany({
      where: { status: PublishStatus.PUBLISHED, date: { gte: now } },
      orderBy: { date: 'asc' },
      take: limit,
    });

    return items.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      date: m.date.toISOString(),
      startTime: m.startTime,
      location: m.location,
      speakers: this.parseStringArray(m.speakers),
    }));
  }

  private parseStringArray(value: unknown): string[] {
    if (!value || !Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string');
  }
}
