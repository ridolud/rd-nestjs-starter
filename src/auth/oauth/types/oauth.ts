export const oauthProviderTypes = ['GOOGLE', 'GITHUB', 'FACEBOOK'] as const;
export type OAuthProviderType = (typeof oauthProviderTypes)[number];

export type OAuthProviderClinetOptions = {
  id: string;
  secret: string;
  secretParamName?: string | undefined;
  idParamName?: string | undefined;
  [key: string]: any;
};
