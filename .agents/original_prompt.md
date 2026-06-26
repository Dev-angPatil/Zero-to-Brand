## 2026-06-16T12:20:24Z

An interactive brand co-pilot platform that takes user craft photos, refines them into high-quality studio marketing images, and generates tailored promotional posters/ads while preserving brand preferences across sessions.

Working directory: /home/deu/Coding Repos/Zero-to-Brand
Integrity mode: development

## Requirements

### R1. Brand Onboarding & Mock-Login Gateway
- Implement a gateway screen allowing creators to select/login to an existing brand or create a new one.
- For new brands, introduce a step-by-step onboarding survey asking questions about the brand owner, target audience, preferred brand aesthetic dials (e.g. rustic, modern, luxury), and design styles.
- Save and retrieve these brand configurations using the local JSON database, ensuring brand preferences persist across sessions.

### R2. Interactive Product Ad & Poster Generation
- When a user uploads/pastes a craft image, display a follow-up questionnaire asking what kind of scene/marketing style they want for this specific image.
- Process the image with Gemini 2.5 Flash to extract the product details and textures.
- Leverage three modular agents (under-the-hood services) to handle the campaign creation:
  - **Preferences Agent**: Locks in the brand's aesthetic dials and questionnaire answers, ensuring consistent color palettes, typography, and styling parameters.
  - **Prompt Engineering Agent**: Takes the extracted product details, user survey responses, and brand preferences to compile a rich prompt for generating a high-quality studio-style product image.
  - **Designer Agent**: Automatically composes a marketing poster/ad design overlaying the brand's custom logo SVG, the generated studio image, and key marketing keywords/copy.

### R3. Brand Workspace & Dashboard Presentation
- Build a dashboard layout that shows:
  - The original uploaded craft image.
  - The generated high-quality studio image.
  - The final generated marketing poster/ad containing branding, tagline, and keywords.
- Support downloading the generated poster or saving it to the brand's campaign history.

## Acceptance Criteria

### Brand & Session Management
- [ ] Users can create a brand and complete the onboarding survey, and the preferences are saved to the local database.
- [ ] Refreshing the browser or logging back in preserves the brand's logo, color palette, tagline, and aesthetic settings.

### Image & Poster Generation
- [ ] Uploading/pasting a product photo prompts the user with additional generation questions.
- [ ] The app successfully uses the Gemini/Imagen APIs to generate a clean, high-quality studio product image.
- [ ] The app generates and displays a marketing poster showing the product image framed with the brand's styling, logo, tagline, and keywords.
