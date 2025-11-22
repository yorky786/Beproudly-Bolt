import { AnalyticsEvent } from '../types';

class Analytics {
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  track(eventName: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      event_name: eventName,
      user_id: this.userId || undefined,
      properties: {
        ...properties,
        platform: 'web',
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }

    console.log('Analytics Event:', event);
  }

  page(pageName: string, properties: Record<string, any> = {}) {
    this.track('page_view', {
      page_name: pageName,
      ...properties,
    });
  }

  identify(userId: string, traits: Record<string, any> = {}) {
    this.userId = userId;
    this.track('user_identified', {
      user_id: userId,
      ...traits,
    });
  }

  trackProfileView(profileId: string) {
    this.track('profile_viewed', { profile_id: profileId });
  }

  trackMatch(matchId: string) {
    this.track('match_created', { match_id: matchId });
  }

  trackMessage(matchId: string) {
    this.track('message_sent', { match_id: matchId });
  }

  trackBlazeCreated(blazeId: string) {
    this.track('blaze_created', { blaze_id: blazeId });
  }

  trackBlazeViewed(blazeId: string) {
    this.track('blaze_viewed', { blaze_id: blazeId });
  }

  trackChallengeSigned(challengeId: string) {
    this.track('challenge_signed', { challenge_id: challengeId });
  }

  trackAchievementEarned(achievementId: string) {
    this.track('achievement_earned', { achievement_id: achievementId });
  }

  trackSubscription(planName: string, price: number) {
    this.track('subscription_purchased', {
      plan_name: planName,
      price: price,
    });
  }

  trackFlamesPurchase(amount: number, price: number) {
    this.track('flames_purchased', {
      amount: amount,
      price: price,
    });
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

export const analytics = new Analytics();

export default analytics;
