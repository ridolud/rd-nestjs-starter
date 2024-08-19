import {
  OAuthProviderClinetOptions,
  oauthProviderTypes,
} from 'src/auth/oauth/types/oauth';

export type OAuthConfig = Partial<{
  [key in (typeof oauthProviderTypes)[number]]: OAuthProviderClinetOptions;
}>;
