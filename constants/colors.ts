import { COLORS } from '../src/constants/colors';

const tintColorLight = COLORS.ACCENT;

export default {
  light: {
    text: COLORS.TEXT_DARK,
    background: COLORS.BG_SCREEN,
    tint: tintColorLight,
    tabIconDefault: COLORS.TEXT_MUTED,
    tabIconSelected: tintColorLight,
  },
};
