export type Category = 'Société' | 'Amour' | 'Tech' | 'Sport' | 'Divertissement' | 'Autre';
export type QuestionPrivacy = 'public' | 'followers' | 'group';
export type QuestionFormat = 'yes_no' | 'multiple_choice' | 'scale';

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  is_private?: boolean;
  privacy_answers?: 'public' | 'followers' | 'none';
  privacy_questions?: 'public' | 'followers';
  notifications_enabled?: boolean;
  notif_new_follower?: boolean;
  notif_question_answers?: boolean;
  notif_new_question?: boolean;
  notif_comments?: boolean;
  notif_messages?: boolean;
  notif_follow_requests?: boolean;
  notif_mentions?: boolean;
  privacy_follows?: boolean;
  cover_url?: string;
  username_changed_at?: string;
  country?: string;
  privacy_groups?: boolean;
  website_url?: string;
  pinned_question_id?: string | null;
  birth_year?: number | null;
  gender?: 'homme' | 'femme' | 'autre' | null;
  onboarding_completed?: boolean;
}

export interface Question {
  id: string;
  author_id: string;
  author?: Profile;
  text: string;
  category: Category;
  privacy: QuestionPrivacy;
  format: QuestionFormat;
  options?: string[];
  created_at: string;
  image_url?: string | null;
  option_images?: (string | null)[] | null;
  group_id?: string | null;
  group?: { id: string; name: string; photo_url?: string } | null;
  yes_count: number;
  no_count: number;
  user_vote?: boolean | null;
  option_counts?: number[];
  user_vote_index?: number | null;
  scale_average?: number | null;
  total_votes?: number;
  following_vote_count?: number;
  comment_count?: number;
}

export interface Vote {
  id: string;
  user_id: string;
  question_id: string;
  answer?: boolean | null;
  answer_index?: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  question_id: string;
  author_id: string;
  author?: Profile;
  text: string;
  created_at: string;
  parent_id?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Profile;
  text: string;
  created_at: string;
  read_at?: string | null;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  other?: Profile;
  last_message_at: string;
  last_message?: string;
}
