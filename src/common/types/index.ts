export * from './authenticated-request.type';
export * from './cookie-request.type';
export * from './uploaded-file.type';
export * from './document-download-result.type';

export type ExpiresStringValue =
  `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;
