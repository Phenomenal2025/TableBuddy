// Keep warnings visible while their translated text follows the selected locale.
export const persistentMessages = new Set([
  'readFailed', 'saveFailed', 'clearFailed', 'sessionInvalid',
  'invalidPlayers', 'invalidExperience', 'unknownEvent', 'invalidScore', 'operationFailed',
]);
export function stateErrorKey(error) {
  return persistentMessages.has(error?.code) ? error.code : 'operationFailed';
}
