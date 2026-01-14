# CogniShift

# "A web that adapts to the mind, not the other way around."

![Gemini](https://img.shields.io/badge/AI-Gemini-blue?style=for-the-badge&logo=googlegemini&logoColor=white) ![JavaScript](https://img.shields.io/badge/Logic-JavaScript-yellow?style=for-the-badge&logo=javascript&logoColor=black) ![Security](https://img.shields.io/badge/Security-DOMPurify-red?style=for-the-badge&logo=probot&logoColor=white) ![Chart.js](https://img.shields.io/badge/Data_Viz-Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

CogniShift is an Al-powered browser extension designed to revolutionize how neurodiverse students interact with the web. Developed for the Innovate 3.0 Hackathon at JIIT Noida, CogniShift leverages cutting-edge, on-device artificial intelligence to create a personalized, distraction-free, and supportive learning

# The Why (Problem Statement)

The modern web is built for the **"neurotypical"** brain, often prioritizing engagement through constant stimulation. For **neurodivergent** students, this creates a digital environment full of obstacles:

* **Sensory Overload**: Autoplay videos, flashing banners, and cluttered sidebars compete for limited attention, leading to rapid cognitive fatigue.
* **The "Wall of Text" Effect**: Long, unstructured articles can feel insurmountable, often causing students to abandon research before they even begin.

**CogniShift** was born to bridge this gap. By moving the "intelligence" of the web directly onto the user's device, we create a browsing experience that is not just productive, but **inclusive**.

# Key Features (ADHD FOCUS MODE)
CogniShift's ADHD mode reduces cognitive overload using AI simplification, guided reading, and distraction-free design tailored to ADHD patterns.

* **AI Content Simplification**: Uses **Gemini** to instantly rewrite complex sentences into clear, ADHD-friendly language without ever sending data to the cloud.
* **Keyword Pastel Highlights**: Automatically identifies and highlights core concepts in soft, non-stimulating pastel colors to aid memory retention and visual scanning.
* **Focus Ruler**: A customizable horizontal guide that follows your cursor, creating a "reading lane" to prevent eye-wandering and line-skipping.
* **Bionic Reading**: Enhances text by bolding the first few letters of each word, creating artificial fixation points that guide the eye for faster, more rhythmic reading.
* **Distraction Removal**: A "one-click" clean view that strips away autoplay videos, sidebars, and intrusive pop-ups, leaving only the essential content.

# How It Works

The **CogniShift** engine follows a precise four-stage pipeline to transform the web experience:

1. **Extraction**: The extension uses **JavaScript Content Scripts** to identify and capture the primary readable content from the active tab, stripping away unnecessary metadata.
2. **Processing**: The extracted text is sent to the **Gemini** model. The AI performs real-time simplification and summarization locally, ensuring zero data latency and absolute user privacy.
3. **Sanitization**: Before the AI's response is rendered, it is scrubbed by **DOMPurify**. This crucial step prevents XSS (Cross-Site Scripting) by ensuring no malicious code can be injected into the browser UI.
4. **Injection & Visualization**: The "clean" simplified text is injected back into the webpage for the user. Simultaneously, **Chart.js** processes the session data to update the user’s productivity metrics on the dashboard.