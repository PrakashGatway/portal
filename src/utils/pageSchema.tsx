// src/utils/pageTypeSchema.js

export const PAGE_TYPES_SCHEMA = {
  "city_page": {
    label: "city_page",
    fields: [
      { name: "heroImage", type: "file", label: "Hero Image", required: false },
    ],
    sections: [
      {
        type: "StudyDestinations",
        label: "Study Destinations",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" }
        ],
      },
      {
        type: "AcademicPrograms",
        label: "Academic Programs",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          // {
          //   name: "testimonials",
          //   type: "array",
          //   label: "Testimonials",
          //   itemFields: [
          //     { name: "name", type: "text", label: "Customer Name" },
          //     { name: "role", type: "text", label: "Role" },
          //     { name: "content", type: "textarea", label: "Quote" },
          //     { name: "avatar", type: "text", label: "Avatar URL" },
          //   ],
          // },
        ],
      },
      {
        type: "WhyChooseUs",
        label: "Why Choose Us",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          {
            name: "Cards",
            type: "array",
            label: "Cards",
            itemFields: [
              { name: "name", type: "text", label: "Label" },
              { name: "icon", type: "text", label: "Icon" },
              { name: "content", type: "textarea", label: "Quote" },
            ],
          },
        ],
      },
      {
        type: "roadmap",
        label: "Road-map",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          {
            name: "steps",
            type: "array",
            label: "Steps",
            itemFields: [
              { name: "name", type: "text", label: "Label" },
              { name: "content", type: "textarea", label: "Quote" },
              { name: "Points", type: "textarea", label: "Points" },
              { name: "icon", type: "text", label: "Icon" }
            ],
          },
        ],
      },
      {
        type: "content",
        label: "Content",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "content", type: "editor", label: "Section content" },
        ],
      },
    ],
  },

  country_page: {
    label: "country_page",
    fields: [
      { name: "heroImage", type: "file", label: "Hero Image", required: false },
      { name: "roadmapImage", type: "file", label: "Roadmap Image", required: false },
      { name: "mobileRoadMap", type: "file", label: "Mobile Roadmap Image", required: false },
      { name: "sliderImage", type: "file", label: "Slider Image", required: false },
    ],
    sections: [
      {
        type: "hero",
        label: "Hero Section",
        fields: [
          { name: "university", type: "text", label: "University", required: false },
          { name: "students", type: "text", label: "Students", required: false },
          { name: "cities", type: "text", label: "Cities", required: false }
        ],
      },
      {
        type: "form-section",
        label: "Form Section",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "roadmapTitle", type: "text", label: "Roadmap Title", required: false }
        ],
      },
      {
        type: "WhyChooseUs",
        label: "Why Choose Us",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          {
            name: "Cards",
            type: "array",
            label: "Cards",
            itemFields: [
              { name: "name", type: "text", label: "Label" },
              { name: "icon", type: "text", label: "Icon" },
              { name: "content", type: "textarea", label: "Quote" },
            ],
          },
        ],
      },
      {
        type: "slider",
        label: "Slider Card",
        fields: [
          { name: "label", type: "text", label: "Label", required: false },
          { name: "title", type: "text", label: "Title", required: false },
        ],
      },
    ],
  },
  home_page: {
    label: "home_page",
    fields: [
      { name: "heroImage", type: "file", label: "Hero Image", required: false },
      { name: "roadmapImage", type: "file", label: "Roadmap Image", required: false },
      { name: "mobileRoadMap", type: "file", label: "Mobile Roadmap Image", required: false }
    ],
    sections: [
      {
        type: "hero",
        label: "Hero Section",
        fields: [
          { name: "university", type: "text", label: "University", required: false },
          { name: "students", type: "text", label: "Students", required: false },
          { name: "cities", type: "text", label: "Cities", required: false }
        ],
      },
      {
        type: "form-section",
        label: "Form Section",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "roadmapTitle", type: "text", label: "Roadmap Title", required: false }
        ],
      },
      {
        type: "WhyChooseUs",
        label: "Why Choose Us",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          {
            name: "Cards",
            type: "array",
            label: "Cards",
            itemFields: [
              { name: "name", type: "text", label: "Label" },
              { name: "icon", type: "text", label: "Icon" },
              { name: "content", type: "textarea", label: "Quote" },
            ],
          },
        ],
      },
      {
        type: "slider",
        label: "Slider Card",
        fields: [
          { name: "label", type: "text", label: "Label", required: false },
          { name: "title", type: "text", label: "Title", required: false },
        ],
      },
    ],
  },
};