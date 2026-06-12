import type { ColorScheme } from "@/components/colors";

export interface AppIcons {
  eye: number;
  like: number;
  highlightLike: number;
  list: number;
  new: number;
  folder: number;
  home: number;
  profile: number;
}

const lightIcons: AppIcons = {
  eye: require("@/assets/icons/light_mod_eye.png") as number,
  like: require("@/assets/icons/light_mod_like.png") as number,
  highlightLike: require("@/assets/icons/highlight_like.png") as number,
  list: require("@/assets/icons/light_mod_list.png") as number,
  new: require("@/assets/icons/light_mod_new.png") as number,
  folder: require("@/assets/icons/light_mod_folder.png") as number,
  home: require("@/assets/icons/light_mod_home.png") as number,
  profile: require("@/assets/icons/light_mod_profile.png") as number,
};

const darkIcons: AppIcons = {
  eye: require("@/assets/icons/dark_mod_eye.png") as number,
  like: require("@/assets/icons/dark_mod_like.png") as number,
  highlightLike: require("@/assets/icons/highlight_like.png") as number,
  list: require("@/assets/icons/dark_mod_list.png") as number,
  new: require("@/assets/icons/dark_mod_new.png") as number,
  folder: require("@/assets/icons/dark_mod_folder.png") as number,
  home: require("@/assets/icons/dark_mod_home.png") as number,
  profile: require("@/assets/icons/dark_mod_profile.png") as number,
};

export function getIcons(scheme: ColorScheme): AppIcons {
  return scheme === "dark" ? darkIcons : lightIcons;
}
