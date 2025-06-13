import { RemindType } from '../schema/user.schema';

export type JoinUserRequest = {
  kakaoId: string;
  email: string;
  displayName: string;
  remindType?: RemindType;
  interestedCerts?: string[];
};
