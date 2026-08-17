import { makeValidator, type Validator, ENUMS } from "./validators";

export const projectsValidator: Validator = makeValidator(() => ({
  title: { required: true, max: 160 },
  slug: {},
  status: { required: true, in: ENUMS.projectStatus },
  locale: { required: true, in: ENUMS.locale },
  summary: { max: 280 },
  client: { max: 160 },
  role_on_project: { max: 160 },
  order_index: { numeric: true },
  views_count: { numeric: true },
}));

export const pagesValidator: Validator = makeValidator(() => ({
  title: { required: true, max: 160 },
  slug: {},
  locale: { required: true, in: ENUMS.locale },
  meta_title: { max: 160 },
  meta_description: { max: 300 },
  order_index: { numeric: true },
}));

export const skillsValidator: Validator = makeValidator(() => ({
  name: { required: true, max: 80 },
  slug: {},
  skill_category_id: { numeric: true },
  icon: { max: 120 },
  order_index: { numeric: true },
}));

export const skillCategoriesValidator: Validator = makeValidator(() => ({
  name: { required: true, max: 80 },
  slug: {},
  locale: { required: true, in: ENUMS.locale },
  order_index: { numeric: true },
}));

export const resumesValidator: Validator = makeValidator(() => ({
  label: { required: true, max: 80 },
  language: { required: true, max: 5 },
  media_id: { required: true, numeric: true },
}));

export const socialLinksValidator: Validator = makeValidator(() => ({
  platform: { required: true, max: 40 },
  url: { required: true, max: 500 },
  icon: { max: 120 },
  order_index: { numeric: true },
}));

export const menuItemsValidator: Validator = makeValidator(() => ({
  label: { required: true, max: 80 },
  locale: { required: true, in: ENUMS.locale },
  parent_id: { numeric: true },
  page_id: { numeric: true },
  external_url: { max: 500 },
  order_index: { numeric: true },
}));

export const siteSettingsValidator: Validator = makeValidator(() => ({
  key: { required: true, max: 80 },
  type: { required: true, in: ENUMS.settingType },
}));

export const certificationsValidator: Validator = makeValidator(() => ({
  type: { required: true, in: ENUMS.certType },
  title: { required: true, max: 160 },
  locale: { required: true, in: ENUMS.locale },
  issuer: { max: 160 },
  icon: { max: 120 },
  period: { max: 60 },
  issued_on: {},
  credential_id: { max: 80 },
  verify_url: { max: 500 },
  description: { max: 2000 },
  order_index: { numeric: true },
}));

export const testimonialsValidator: Validator = makeValidator(() => ({
  quote: { required: true },
  author: { required: true, max: 120 },
  locale: { required: true, in: ENUMS.locale },
  role: { max: 160 },
  avatar_media_id: { numeric: true },
  order_index: { numeric: true },
}));