import * as migration_20260808_093132 from './20260808_093132';
import * as migration_20260901_114728_add_bot_collections from './20260901_114728_add_bot_collections';

export const migrations = [
  {
    up: migration_20260808_093132.up,
    down: migration_20260808_093132.down,
    name: '20260808_093132',
  },
  {
    up: migration_20260901_114728_add_bot_collections.up,
    down: migration_20260901_114728_add_bot_collections.down,
    name: '20260901_114728_add_bot_collections'
  },
];
