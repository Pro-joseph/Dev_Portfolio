export interface Dictionary {
  langName: string;
  nav: {
    downloadResume: string;
    getInTouch: string;
    brandFallback: string;
    projects: string;
    skills: string;
    contact: string;
  };
  hero: {
    viewMyWork: string;
    openToWork: string;
    roleFallback: string;
    heroImageAltSuffix: string;
    environment: string;
    scrollToProjects: string;
    stats: {
      featuredProjects: string;
      skillCategories: string;
      technologies: string;
      status: string;
    };
    statusOpen: string;
    statusBusy: string;
    featured: {
      eyebrow: string;
      title: string;
      subtitle: string;
    };
    gallery: {
      eyebrow: string;
      title: string;
      subtitle: string;
    };
    skills: {
      eyebrow: string;
      title: string;
      body: string;
    };
    terminal: {
      title: string;
      systemStatus: string;
      online: string;
      categories: string;
      skills: string;
      status: string;
      openToWork: string;
      notAvailable: string;
    };
    testimonials: {
      eyebrow: string;
      title: string;
      subtitle: string;
    };
  };
  projects: {
    allProjects: string;
    description: string;
    backToPortfolio: string;
    eyebrow: string;
    views: string;
    status: string;
    view: string;
    breadcrumb: string;
    role: string;
    timeline: string;
    present: string;
    techStack: string;
    projectStatus: string;
    personalProject: string;
    viewCaseStudy: string;
  };
  certifications: {
    title: string;
    description: string;
    eyebrow: string;
    academicBackground: string;
    professionalCertifications: string;
    issued: string;
    verifyBadge: string;
    dash: string;
  };
  status: {
    draft: string;
    published: string;
    archived: string;
  };
  sectionHeader: { viewAll: string };
  skillCard: { items: string };
  cta: {
    heading: string;
    body: string;
  };
  footer: {
    rights: string;
    engineeredIn: string;
    taglineFallback: string;
  };
  lightbox: {
    galleryAltSuffix: string;
    projectImageAltSuffix: string;
    lightboxLabel: string;
    close: string;
    prev: string;
    next: string;
    openInLightbox: string;
  };
  langSwitch: { ariaLabel: string };
}