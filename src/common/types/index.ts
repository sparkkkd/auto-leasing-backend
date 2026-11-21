export * from './authenticated-request.type';
export * from './cookie-request.type';

export type ExpiresStringValue =
  `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;
