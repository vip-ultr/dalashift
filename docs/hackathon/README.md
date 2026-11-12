# NASA Space Apps Challenge 2026 — Participation Reference

**All facts on this page were verified on 2026-11-13 against official NASA
Space Apps sources.** Where something could not be verified, it is listed in
[§ 9 — Unverified / needs confirmation](#9-unverified--needs-confirmation)
rather than asserted.

> **The most important date: the 2026 challenge runs Saturday 14 – Sunday 15
> November 2026.** That is *tomorrow*. The Kano Local Event starts at 09:00 on
> Saturday at EHealth Africa, Badawa, Kano.
>
> Source: <https://www.spaceappschallenge.org/resources/participant-faqs/> —
> *"The 2026 NASA Space Apps Challenge will take place November 14-15, 2026."*

---

## 1. Which challenge are we entering?

### Recommendation: **"Field Shift: Adapting Farms with NASA Data"**

<https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/>

> *"Farmers around the world navigate shifting temperatures, changing rainfall
> patterns, water shortages, extreme weather, and declining soil health. These
> pressures make it difficult to choose crop rotations that protect fields,
> conserve water, and support long‑term resilience. Your challenge is to create
> a decision‑support tool that uses NASA Earth observations along with local
> soil information, crop characteristics, and farmer priorities to help farmers
> explore rotation strategies that could strengthen soil health and adapt their
> farms to changing conditions."*
> — verbatim, official 2026 challenge statement

This is a **direct match** for this product, and the working name **DalaShift**
is derived from it.

The challenge statement explicitly names the NASA datasets it expects:

> *"SMAP, ECOSTRESS, GPM, Landsat, MODIS, NASA POWER, GRACE and GRACE‑FO, and
> SRTM or other NASA elevation products."*

and the analysis angles it lists:

> *"temperature, heat stress, rainfall, soil moisture, evaporation, frost risk,
> extreme precipitation, vegetation stress, and long‑term water trends."*

### What the challenge requires that our Phase 1 scope did not yet include

This is the single most important gap found during research. The challenge
statement says:

> *"**You may compare at least three rotation strategies, including the
> existing rotation.** For each strategy, you may explain why it was
> suggested, what evidence supports it, what benefits it may offer, where
> information gaps exist, and any risks that would need local review by
> farmers or agricultural experts."*

**[Proposed]** Three additions to the product:

| Addition                                                  | PRD reference |
| --------------------------------------------------------- | ------------- |
| **Crop rotation strategy comparison** — the farmer's current rotation plus at least three alternatives, each with evidence, benefits, information gaps and risks | `FR-8` (new) |
| **Farmer priorities** as an explicit input — what the farmer wants the rotation to achieve | `FR-2.13` (new) |
| **ECOSTRESS** (evapotranspiration), **GRACE/GRACE-FO** (groundwater), **SRTM** (elevation) added to the candidate source list | `docs/api/data-sources.md` |

**[Proposed]** The comparison requirement fits our existing architecture
almost perfectly: a rotation is a set of crops with a sequence, and our rules
engine already scores crops against farm conditions. A rotation strategy is
therefore a *set of crop scores* plus rotation-specific rules (e.g. a legume
after a cereal contributes to soil nitrogen). This is an extension of the
recommendation engine, not a new subsystem.

### Alternatives considered

| Challenge                                                              | Fit for a Kano team                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Dancing with the SARs](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/) | Good — NISAR, "farming activities" as a surface-change type. Less aligned with our built product. |
| [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) | Good — "agricultural burns", a real northern Nigeria problem (annual bush burning). A second viable option. |
| [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/) | Medium — trend analysis across Earth science variables; our monitoring feature fits. |
| [The Earth Information Jukebox](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/) | Low — sonification. Different product. |

**Decision required from the team.** Our recommendation is **Field Shift**.
The name of the project already points at it, and the challenge brief is
written for exactly this product.

---

## 2. Event structure

| Aspect              | Detail                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Format**          | One global event, **14–15 November 2026**, with two participation pools: **Local Events** (~596) and the **Universal Event** (virtual, anywhere). |
| **Our pool**        | **Kano Local Event** — in person. All team members must be registered at the **same** Local Event.                      |
| **Countries**       | 116 countries host local events in 2026.                                                                                |
| **Challenges**      | **14 global challenges** — the same catalog for Local and Universal Events. Each team addresses **one** challenge.      |
| **Judging**         | Local judges → **Global Nominees** → Global judging → 10 Global Awards. Universal Event projects are judged **separately** against other Universal submissions. |
| **Nigeria partner** | **NASRDA** (National Space Research and Development Agency) is one of the 17 Space Agency Partners for 2026 — <https://www.spaceappschallenge.org/2026/space-agency-partners/> |

> *"You may participate in an in-person or virtual Local Event near you or the
> virtual Universal Event if there is not an event near you."*
> — Participant FAQs

> *"We highly encourage participants to join a Local Event near them if they
> have the option rather than the Universal Event. Local Events provide access
> to a closer community, coaching opportunities, and many are in-person."*
> — Participant FAQs

> **Critical rule:** *"All team members must be confirmed participants at the
> same Local Event in order for your team's project to be eligible for awards."*
> A Kano team cannot mix in an Abuja or Ibadan member.

---

## 3. The Kano Local Event

<https://www.spaceappschallenge.org/2026/local-events/kano/>

| Field        | Value                                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| Name         | NASA Space Apps Challenge – Kano Local Event 2026                                       |
| Location     | Kano, Kano State, Nigeria                                                                |
| Venue        | **EHealth Africa, 4–6 Independence Rd, Badawa, 700213, Kano**                            |
| Format       | In person — status **"Accepting Participants"**                                          |
| Local Lead   | **Abdulkadir Nuhu Aminu** — `abduldesertsky@gmail.com` — **+2348097766776** (WhatsApp)     |
| Organiser    | Desert Sky Exploration                                                                  |
| Tagline      | "Think Global. Innovate Local. Build for Earth and Space."                                |
| Start        | **Saturday, 14 November 2026, 09:00** (livestream 14–15 Nov)                              |
| Registrations| 230 (counted 2026-11-13)                                                                  |

**The Kano event page explicitly steers local problems toward our subject
area.** Verbatim:

> *"Northern Nigeria has a large agricultural economy. Space-based and
> Earth-observation data can contribute to solutions involving: Crop monitoring,
> Soil conditions, Drought, Irrigation, Agricultural productivity, Weather
> information, Food security"*

and under CLIMATE CHANGE:

> *"Flood monitoring, Drought prediction, Desertification, Extreme temperatures,
> Climate adaptation, Water management, Environmental monitoring"*

and under WATER RESOURCES:

> *"Water availability, Flood-risk mapping, Irrigation planning, Water-quality
> monitoring, Sustainable resource management"*

**The Kano page also confirms the team size and framework we are aligned
with:**

> *"NASA Space Apps has historically allowed teams of up to six participants,
> and multidisciplinary teams are strongly encouraged."*

> *"PROBLEM → DATA → IDEA → SOLUTION → PROTOTYPE → IMPACT → STORY"*

and lists **"Decision-support tool"** among valid prototype types.

**Plan of activities published for the Kano event:** registration and
accreditation → opening ceremony → orientation → introduction to NASA Space
Apps → challenge briefing → team formation → workshops → mentoring → data
exploration → brainstorming → coding and development → prototype creation →
project documentation → testing → pitch preparation → project submission →
local judging → project demonstrations → awards and closing ceremony.

### Other Nigeria 2026 events (fallback options)

| City        | Format              | Registrations | Local Lead                    |
| ----------- | ------------------- | ------------- | ----------------------------- |
| **Kano**    | In person           | 230           | Abdulkadir Nuhu Aminu         |
| Lagos       | In person           | 145           | —                             |
| Abuja       | Virtual & in person | 134           | Isah Daniel Ugbede            |
| Ibadan      | Virtual             | 90            | `1stspacemanxavier@gmail.com` |
| Gombe       | In person           | 33            | —                             |
| Ogbomoso    | Virtual             | 29            | —                             |
| Tigbo-Ilu   | Virtual & in person | 25            | —                             |
| Nsukka      | In person           | 14            | —                             |
| Azare       | In person           | 13            | —                             |
| Osogbo      | Virtual & in person | 6             | —                             |

**[Open]** If any team member cannot be in Kano, **the whole team must move to
one event together** — a Kano team cannot mix with an Abuja member. Decide
before registering.

---

## 4. Rules that directly affect this repository

### 4.1 Open source — the licence decision is now binding

Source: <https://www.spaceappschallenge.org/legal/> (Participant Terms &
Conditions, updated 7 August 2026), "Intellectual Property Rights in
Solutions":

> *"All posted Solutions will be available for others to download or use. You
> agree that any original content (that is, content that you have created for
> the NASA Space Apps Challenge) is **freely available without restriction or
> is licensed as open source as defined by the Open Source Initiative (OSI)**."*

> *"**If you do not specify a specific OSI compliant license, NASA will
> distribute your original content under an Apache 2.0 license.**"*
> → <https://www.opensource.org/licenses/Apache-2.0>

And for third-party materials:

> *"Any licenses applicable to your Solution Materials must be identified in
> the documentation that you submit with your Solution. NASA will not accept or
> post any Solutions that do not include appropriate license documentation."*

**Consequences for this repository:**

1. **An OSI licence is mandatory.** `LICENSE` must contain a real, complete
   OSI-approved licence text before submission. The current placeholder is not
   acceptable for submission.
2. **Apache-2.0 is the fallback** if we specify nothing. Choosing explicitly
   is better than relying on the default.
3. **Every dependency's licence must be identifiable** in our submission
   documentation. `docs/api/data-sources.md` and a `THIRD_PARTY_NOTICES` file
   cover this.

**This upgrades `ADR-0001` from "nice to have" to a blocking submission
requirement.** Recommendation to the team: **Apache-2.0** (explicit patent
grant, matches NASA's own default) or **MIT** (shortest, most familiar). Our
dependency set is MIT/BSD-compatible, so both work.

### 4.2 NASA data is mandatory for Global Award eligibility

Source: <https://www.spaceappschallenge.org/resources/project-submission-guide/>
(published 12 November 2026):

> *"**To be eligible for a Global Award, you must use at least one NASA data
> or resource.**"*

The submission form has a dedicated **"NASA Data"** field, and the **Relevance**
judging criterion rewards this:

> *"It meaningfully integrates NASA data, utilizing it as a core component of
> the proposed solution rather than a superficial addition."*
> — a 5/5 Relevance score is *"NASA data is integral to the project's success."*

**This is why the challenge says "Field Shift" and why NASA data must be
structural, not decorative.** Our architecture already satisfies this: NASA
POWER, SMAP, GPM/IMERG, MODIS and Landsat are the backbone of the
environmental layer.

### 4.3 Super Intelligence (SI / AI) usage — disclosure is required

NASA's 2026 rules define "Super Intelligence" (SI) explicitly, and the FAQ
cites a 29 September 2026 US Executive Order requiring the term.

> *"Super Intelligence (SI) refers to computer systems that perform tasks
> typically associated with human reasoning, decision-making, content creation,
> and problem-solving. Examples include large language models, conversational
> assistants, image and video generation tools, foundation models, and code
> generation tools."*
> — Participant FAQs

> *"Participants may use SI tools to accelerate innovation, streamline
> development, and enhance creativity in support of their challenge solution.
> **Each team's project submission must include a description of how SI tools
> were used during the development of their project.**"*
> — Participant FAQs

From the Project Submission Guide's "Use of Super Intelligence (SI)" field:

- *"The use of SI tools, such as machine learning, chatbots, image generation,
  and large language models, is permitted."*
- *"**SI should not be used to (come up with your idea of how to solve the
  challenge).**"*
- *"Generated content may not use, contain, or modify any **NASA branding or
  design elements** (such as the NASA logos, flags, or mission identifiers)."*
- **Images and videos:** *"Must include a visible watermark to indicate SI
  generation."*
- **Audio:** *"Must acknowledge SI generation in descriptive text and metadata."*
- **Code and data:** *"Must acknowledge SI generation in descriptive text and
  metadata."*
- The SI answer *"is for data-collection purposes only, and your response will
> not be seen by the judges. However, judges will be able to see any SI-generated
  indicators within your project."*

**Consequences for this repository — and they are significant:**

| Requirement                   | How DalaShift must comply                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Describe how SI was used      | A written account of the AI-assisted development of this repository. Must be submitted.      |
| SI must not originate the idea | The product idea came from the team. The AI-assisted work is implementation and research.   |
| No NASA branding in SI content | No NASA logos, flags or mission identifiers in anything AI-generated — **including this repo's imagery**. |
| Acknowledge SI in code        | AI-generated code must be acknowledged in text and metadata. A `NOTICE` / `CONTRIBUTING` note and a per-file convention. |

**[Proposed]** The submission's SI disclosure should state plainly:
AI coding agents assisted with repository scaffolding, documentation, research
synthesis and parts of the implementation; the product concept, the agronomic
methodology and the field validation were human work; no AI output was used to
generate any NASA-branded imagery.

This is also an **ethical and product** matter for us: our entire product
premise is that recommendations must be traceable and non-fabricated. An AI
that wrote the agronomic catalog would undermine it. Our rules engine design
(ADR-0004) and this rule are aligned — good.

### 4.4 Citation is mandatory — including for open-source resources

Source: <https://www.spaceappschallenge.org/legal/>, "Use of Third-Party
Materials":

> *"**You must cite every source that is used in the creation of your project,
> even if it is open source or freely available.** NASA reserves the right to
> remove Solution Materials that do not cite references and resources
> appropriately… NASA also reserves the right to remove nominations, awards, or
> winner status from teams that do not cite resources used in their Solution;
> **all resources, even open source resources, must be cited.**"*

The submission form's **"Space Agency Partner Data and Other References"**
field:

> *"List all of the data, resources, and tools used in your project. Resources
> should include any code, text, and images (even if they are open source or
> freely available) that you used when creating your project. If you are using
> any copyrighted materials, make sure you have permission to use them."*

Required submission checkbox #2:

> *"I confirm that the submitted project represents my team's original work and
> that all external resources including code, text and images (even if they are
> open source or freely available) used in the project are listed in the
> References field of the project submission form."*

**Consequences:**

1. **Every source in `docs/api/data-sources.md` must appear in the submission
   References field.**
2. **Every npm dependency must be citable.** A `THIRD_PARTY_NOTICES` /
   `NOTICE` file listing the direct dependencies and their licences is
   required — this is also good practice for the repository.
3. **Our crop-calendar and crop-requirement sources must be cited** — the
   Sacks et al. (2010) dataset and every agronomic reference in the catalog.

### 4.5 Eligibility and conduct

| Rule | Detail | Source |
| ---- | ------ | ------ |
| **Age** | Open to all ages. Under-18s must be registered by a parent/guardian and accompanied at all times. | FAQs |
| **Cost** | **Free.** *"If you are asked to pay money to participate in any aspect of a NASA Space Apps event, do not pay anything and please report to info@spaceappschallenge.org."* | FAQs |
| **US federal employees** | **Not eligible** to register as Participants. | Terms & Conditions |
| **China-affiliation restriction** | *"Space Apps participants may not participate in Space Apps in connection with an affiliation with China or a Chinese-owned entity."* Includes universities incorporated under Chinese law (incl. Hong Kong/Macau). Teams undergo a review for prohibited bilateral activity before Global Judging. | Terms & Conditions |
| **Under-18 likenesses** | *"Recognizable names, voices, and likenesses of persons under the age of 18 should not be included in any video or project submissions."* Applies to avatars and team photos too. | Terms & Conditions |
| **Conduct** | Report discrimination, harassment or bullying to the Local Lead and/or conduct@spaceappschallenge.org. | FAQs |
| **Export control** | Teams are *"solely responsible"* for ensuring no ITAR/EAR-controlled information is included. | Terms & Conditions |

### 4.6 Team rules

Source: <https://www.spaceappschallenge.org/resources/team-formation-guide/>
(published 23 September 2026):

- **Local Event teams: minimum 1 member. Maximum 6.** Universal Event teams: minimum 2 for global judging.
- *"The ideal size for a team is four to five people to balance skill sets."*
- *"You may only be on one team and each team may only submit a project for one challenge."*
- Members can be added until the hackathon ends, 15 November 2026 at 23:59 local time. *"Teams cannot add members after project submission closes."*
- The **Team Owner's Local Event** defines the team's event, the due date and the local judging panel.
- Team photo optional; must not contain under-18 likenesses.
- Team Owners must publish a "Team Contact Information" field on the About tab.

**[Proposed]** Our team of three is within the limit. The ideal is 4–5, but
we cannot invent members. **Freeze the roster before the hackathon starts.**

### 4.7 Pre-hackathon work

> *"Teams are not allowed to begin working on the challenges prior to the
> hackathon."* — Participant FAQs

Challenge **summaries** were released 17 September 2026; **full statements**
on 28 October 2026; **challenge Resources tabs** on 13 November 2026.

**[Open — team judgement required]** This repository's Phase 1 work was
research, product definition and architecture — **not** a working solution to
the challenge. The distinction matters and should be stated accurately if
asked:

- We have **not** implemented the challenge solution. No functional product
  exists.
- We have researched data sources and NASA Space Apps rules — the same
  research every team would do.
- The **idea** predates any AI assistance and is the team's own.

**[Verified 2026-11-13] The timeline.** The repository was created and
committed on **13 November 2026**, one day before the event opened on
14 November at 09:00. That timing is materially favourable: it reads as
thorough preparation immediately before the event, not as a solution built in
advance.

**[Proposed] Two notes on how this should be handled.**

1. **The rule's target is the pre-built solution, not preparation.** Reading
   the challenge statement is obviously permitted — NASA published the full
   statements on 28 October and the Resources tabs point teams at the
   datasets. Preparing tooling and understanding the data is what the
   challenge's own plan of activities lists as *"data exploration"*.
2. **The pre-work language appears in the Participant FAQs, which are
   guidance. It was not found in the binding Participant Terms & Conditions**
   during our review of the legal page — that document covers IP and
   open-source licensing, third-party materials and citation, eligibility,
   the China-affiliation restriction, export control and liability.
   **[Open]** Confirm with the Local Lead whether the pre-event position
   matters for the local judging panel.

**[Proposed] Do not rewrite the git history.** Rewriting timestamps is
discoverable — GitHub retains push events and the original author dates — and
it converts a defensible position into something that looks considerably
worse if noticed. Force-pushing shared history the day before the event also
risks losing work. **State the timeline plainly instead:** the repository
already carries a short, factual note at the top of the README saying exactly
what was prepared and that no part of the application existed before the
event.

**[Proposed] If asked directly, answer straight and do not hedge:**

> *"We did the data-source research and the architecture in advance — it is
> documented with citations and verification dates. The application itself was
> built during the event."*

That answer is true, and the repository supports it: `docs/api/data-sources.md`
is source research, and `apps/web/src/app/page.tsx` is a placeholder that says
so.

---

## 5. Judging criteria

Source: <https://www.spaceappschallenge.org/resources/judging-awards-guide/>
(published 12 November 2026).

*"At every level of judging, from Local and Universal Events to Executive
Judging, your project will be evaluated on a scale of 1-to-5, in each of the
following criteria."*

| Criterion    | What a 5/5 looks like (verbatim, abridged)                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Impact**   | *"This project demonstrates exceptional impact, addressing a significant problem with proposed solutions. Its reach is extensive, inspiring, benefits a large audience, or could change the world. The quality and effectiveness of the project far exceeds expectations, setting a high standard for others."* |
| **Creativity**| *"This project showcases remarkable creativity, introducing a groundbreaking approach that has never been attempted before. It challenges conventional methods, presenting an original and inventive proposed solution that stands out in its field. The uniqueness of the idea makes it a true innovation."* |
| **Validity** | *"This proposed solution is scientifically sound and technically feasible, demonstrating strong alignment with established principles. It is fully developed and ready for real-world implementation, effectively achieving its intended purpose. The project is highly usable and user-friendly, making it accessible and practical for widespread application."* |
| **Relevance**| *"This project thoroughly engages with the challenge, delivering a proposed solution that is deeply connected to the intended goals. NASA data is integral to the project's success, providing meaningful insights that drive the innovation forward. The use of data is well-executed, enhancing both the credibility and impact of the solution."* |
| **Presentation** | *"The team delivered a well-structured and compelling presentation, clearly articulating the challenge, proposed solution, and importance of the project. Their storytelling was engaging, allowing the audience to fully grasp the significance and potential impact of the work. The delivery was polished, structured, and highly effective in communicating their ideas."* |

> *"Judges evaluate the demo and full project to compute this score"*
> (Presentation).
>
> *"While many NASA Space Apps Challenge teams consider the first four judging
> criteria carefully… remember to pay equal attention to the final criterion:
> presentation."*

### The 10 Global Awards

Best Use of Science · Best Use of Data · Best Use of Technology · Galactic
Impact · Best Mission Concept · Most Inspirational · Best Storytelling Award ·
Global Connection Award · Art & Technology Award · **Local Impact Award**

> **Local Impact Award** — *"The project that demonstrates the greatest
> potential for making a difference in their local community."*
> — <https://www.spaceappschallenge.org/awards/>

**[Proposed]** The Local Impact Award is the most winnable for a Kano team,
and our validation location (Tofa LGA, Kano State) is exactly the kind of
grounded local evidence it rewards. **Local Impact should be an explicit
narrative goal, not a side effect.**

---

## 6. Required deliverables

### 6.1 The eight project-page fields

Source: <https://www.spaceappschallenge.org/resources/project-submission-guide/>

| # | Field                                        | Notes                                                                                                        |
| - | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1 | **Project Name**                             |                                                                                                              |
| 2 | **High-Level Project Summary**               | *"What did you develop? How does it address the challenge? Why is it important?"*                             |
| 3 | **Link to Project Demo**                     | 7-slide deck or ≤30-second video, hosted externally, publicly accessible.                                     |
| 4 | **Link to Final Project**                    | *"a website you created to showcase your project, a cloud-based hosting service or code repository, or platforms such as YouTube, Google Drive, GitHub, One Drive, Dropbox"* |
| 5 | **Detailed Project Description**             | *"What exactly does it do? How does it work? What benefits does it have? What do you hope to achieve? What tools, coding languages, hardware, or software did you use to develop your project?"* |
| 6 | **Use of Super Intelligence (SI)**            | Disclosure. Not seen by judges, but SI markers are.                                                          |
| 7 | **NASA Data**                                | *"Provide specific details about what NASA data and resources you used."*                                     |
| 8 | **Space Agency Partner Data and Other References** | The full citations list — **everything**, including open-source code.                                     |

### 6.2 The demo — mandatory, with hard limits

> *"**All teams must create a Project Demo** as part of their project
> submission."*

| Constraint           | Rule                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Format**           | **Video ≤ 30 seconds** OR **slide deck ≤ 7 slides** (including title and intro slides).                     |
| **Hosting**          | External — *"You will not be able to upload your video or slides to the NASA Space Apps website."*          |
| **Accessibility**    | *"The link you provide should not require a password, permission, or registration."* **Test in a private browser.** |
| **Language**         | *"You must use English language on the project submission page and in any linked materials."* A video may be in another language but **must include English subtitles**. Slide decks must be in English. |
| **Eligibility**     | *"Projects that exceed these limits will not be eligible for Global Judging."*                              |
| **Slide deck content** | Must include team name, names of team members, and the challenge selected.                                |

Suggested video structure (from the guide): 0:00 introduce yourself/team →
0:02 which challenge → 0:05 project title + tagline → 0:10 how it works + NASA
data → 0:20–0:30 the future.

### 6.3 File upload rules

- The project page **allows** images (JPG, PNG, GIF, up to 10 MB) by upload or
  copy-paste.
- The project page **does not allow** video or document uploads — host those
  externally.
- If the project is a website, NASA recommends requesting a **FortiGuard Web
  Filter Classification** (Category: education / personal website / reference /
  web-based application; Company Name: "N/A") so judges are not blocked.

### 6.4 Submission mechanics

1. Profile icon → **"My Team"** → **"Project"** tab → blue **"Edit"** button.
2. **"Save Progress"** as you go — changes are team-private until submitted.
3. The "Project" tab appears only once the hackathon starts: *"The 'Project'
   tab will appear only when the hackathon begins on November 14, 2026 at 9:00
   a.m. local time."*
4. Tick **"Terms and Conditions"** and **"Confirm All Work is Original"**.
5. Click **"Submit for Judging."**
6. *"You may edit and resubmit your project as many times as you'd like until
   the end of the hackathon. Only your last saved submission will be reviewed."*

### 6.5 Local judging layer

> *"Following the hackathon, all project submissions from each Local Event will
> be evaluated by a panel of Local Judges, who are recruited, trained, and
> organized by the designated Local Lead."*

Local awards are **separate** from the Global process. Selected projects become
**Global Nominees**.

---

## 7. Deadlines

| Date                                     | Event                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| 26 August 2026                          | Registration opens                                                    |
| 17 September 2026                        | Challenge summaries available; team formation opens                    |
| 23 September 2026                        | Team Formation Guide published                                         |
| 28 October 2026                          | Full challenge statements available                                    |
| 3 November 2026                         | Space Apps Connect opens (the registration PDF says 2 Nov — treat as 3) |
| 12 November 2026                        | Project Submission Guide and Judging & Awards Guide published          |
| **13 November 2026**                    | Challenge Resources tabs published; Global Offers available            |
| **14 November 2026, 09:00 local**        | **Project submission opens**; Kano event starts at EHealth Africa      |
| **15 November 2026, 23:59 local**        | **Project submission CLOSES** — *"Any projects saved or submitted past this deadline will not be eligible for judging."* |
| 30 November 2026                        | Participant survey due                                                 |
| After the hackathon                      | Kano local judging → global judging                                     |
| 3 December 2026                          | Global Nominees announced                                               |
| 17 December 2026                         | Global Finalists + Honorable Mentions announced                        |
| 26 January 2027                          | Global Winners announced                                                |

> *"Check with your Local Lead about times for your Local Event's local judging
> and awards which may differ from the global submission times."*
> — Participant FAQs

---

## 8. Action list for the team

### 8.1 Before the hackathon starts (today)

- [ ] **Register all three members for the Kano Local Event.** All members must
      be at the same event. <https://www.spaceappschallenge.org>
- [ ] **Confirm the challenge selection** — recommendation: *Field Shift:
      Adapting Farms with NASA Data*.
- [ ] **Contact the Local Lead** (`abduldesertsky@gmail.com`,
      **+2348097766776**) to confirm: venue, the Sunday schedule, local judging
      time, the demo/pitch slot, internet/power availability, and parking.
- [ ] **Choose an OSI licence and write it into `LICENSE`** — blocking
      requirement ([ADR-0001](./../decisions/ADR-0001-open-source-license.md)).
- [ ] **Decide repository visibility** ([ADR-0009](./../decisions/ADR-0009-repository-visibility.md)).
- [ ] **Create a `THIRD_PARTY_NOTICES.md`** listing every direct dependency and
      data source with its licence.
- [ ] **Write the SI disclosure text** for the submission.
- [ ] **Freeze the team roster** — no members added after submission closes.
- [ ] **Pre-register Google Earth Engine** (Community Tier) if we plan to use
      it — see `docs/api/google-earth-engine.md`. Registration and the
      noncommercial questionnaire can take 1–2 hours.
- [ ] **Create the NASA Earthdata account** if any DAAC access is needed
      (<https://urs.earthdata.nasa.gov>).
- [ ] **Register the Supabase project** and set up the demo farm fixtures.
- [ ] **Check the challenge Resources tabs** for the authoritative dataset URLs
      the judges expect to be cited.

### 8.2 During the hackathon (14–15 November)

- [ ] Build to the MVP list in `PRD.md` § 11 — do not expand scope.
- [ ] Produce the demo: **≤30-second video OR ≤7 slides**, in English.
- [ ] Prepare the References list — **everything**, including open source.
- [ ] Prepare the NASA Data field with **specific** dataset names and how each
      was used.
- [ ] Prepare the SI disclosure.
- [ ] Seed the demo data before the pitch — **never depend on a live upstream
      call during the demo**.
- [ ] **Save Progress** frequently on the submission page.
- [ ] **Test every link in a private browser window** before submitting.
- [ ] Submit before **Sunday 23:59**.

---

## 9. Unverified / needs confirmation

| # | Item                                                                                          | Why it matters                                                                              | How to resolve |
| - | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------- |
| 1 | **Kano's detailed schedule.** Only "SATURDAY, NOVEMBER 14 09:00" is published. Local judging time, pitch slots and Sunday's end time are **not published**. | Determines when the demo must be finished. | Ask the Local Lead. |
| 2 | **Challenge "Resources" tabs** all showed "Resources will be available on Friday, November 13." at the time of checking. | These are the authoritative NASA dataset URLs judges expect to be cited. | Re-check each challenge page's Resources tab. |
| 3 | **"Global Offers" (13 November)** — listed in the FAQ but no stable page URL was reachable. | Free tools from the 2026 Global Collaborators (Microsoft, Google, Meteomatics, GoDaddy, Miro). | Watch <https://www.spaceappschallenge.org/2026/> and <https://github.com/nasa/spaceapps>. |
| 4 | Whether non-Kano participants may register for the **in-person** Kano event, and under-18 requirements. | *"Local Events may have additional requirements for persons under 18 to be eligible to participate in person. Check with your Local Lead."* | Ask the Local Lead. |
| 5 | **Venue logistics** — internet bandwidth, power/charging, catering, parking, whether "EHealth Africa, 4–6 Independence Rd, Badawa" is final. | Determines whether we can rely on cloud APIs and live raster processing on site. | Ask the Local Lead / the event page's "Venue Details" tab. |
| 6 | **Local judging rubric / local award categories** for Kano. | Local awards are set by the Local Lead. | Ask the Local Lead. |
| 7 | **Space Apps Connect open date: 2 November (PDF) vs 3 November (FAQ).** | Affects when the team chat opens. | Treat as 3 November; verify on <https://github.com/nasa/spaceapps>. |
| 8 | Whether members can in practice be added between 14 Nov 09:00 and the 15 Nov 23:59 cut-off (the Team Formation Guide and the Judging Guide differ in emphasis). | Team composition. | **Plan for a frozen roster by 14 Nov 09:00.** |
| 9 | Whether the "Confirm All Work is Original" checkbox has specific semantics for AI-generated code beyond the SI field. | Submission compliance. | Disclose fully in the SI field and in References. |
| 10 | Whether the pre-hackathon research in this repository is acceptable under *"Teams are not allowed to begin working on the challenges prior to the hackathon."* | Integrity. | **Team judgement.** Our position: research and architecture, not a solution. Keep it factual. |

---

## 10. Source list

All URLs verified reachable on **2026-11-13**.

| # | URL                                                                                                    | Used for |
| - | ------------------------------------------------------------------------------------------------------ | -------- |
| 1 | <https://www.spaceappschallenge.org/resources/participant-faqs/>                                       | Dates, eligibility, team rules, SI definition, important dates, Universal Event rules |
| 2 | <https://www.spaceappschallenge.org/legal/>                                                            | Participant Terms & Conditions (updated 7 Aug 2026): IP/open source, third-party citation, China restriction, under-18 media, export control |
| 3 | <https://www.spaceappschallenge.org/resources/project-submission-guide/>                                | Submission window, 8 project fields, demo spec, file rules, SI disclosure, "at least one NASA data or resource", References |
| 4 | <https://www.spaceappschallenge.org/resources/judging-awards-guide/>                                   | 5 judging criteria + 1–5 rubrics, Global Judging checklist, judging dates, 10 awards |
| 5 | <https://www.spaceappschallenge.org/resources/team-formation-guide/>                                  | Team size (1–6), one team/one challenge, Team Owner rules, member deadline |
| 6 | <https://www.spaceappschallenge.org/2026/challenges/>                                                   | The 14 challenges, verbatim summaries, subjects, difficulty |
| 7 | <https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/>                     | **The Field Shift statement** — background, objectives, potential considerations |
| 8 | <https://www.spaceappschallenge.org/2026/local-events/kano/>                                           | Kano 2026 event: venue, lead, schedule, local problem areas |
| 9 | <https://www.spaceappschallenge.org/2026/local-events/abuja/> · `/lagos/` · `/ibadan/` · `/gombe/` · `/nsukka/` · `/azare/` · `/ogbomoso/` · `/osogbo/` · `/tigbo-ilu/` | Other Nigeria 2026 events |
| 10 | <https://www.spaceappschallenge.org/2026/local-events/universal-event/>                                | Universal Event rules |
| 11 | <https://www.spaceappschallenge.org/2026/space-agency-partners/>                                       | 17 partners incl. Nigeria NASRDA |
| 12 | <https://www.spaceappschallenge.org/awards/>                                                          | 10 Global Award definitions |
| 13 | <https://www.spaceappschallenge.org/blog/explore-the-next-frontier-at-the-2026-nasa-space-apps-challenge> | Theme "The Next Frontier", 2025 statistics, event counts |
| 14 | <https://science.nasa.gov/universe/nasa-welcomes-all-ages-experience-levels-for-space-apps-challenge> | NASA.gov confirmation of the Nov 14–15 dates and "500+ local events" |
| 15 | <https://github.com/nasa/spaceapps>                                                                    | Official Space Apps Connect forum |
| 16 | <https://www.opensource.org/docs/osd> · <https://www.opensource.org/licenses/Apache-2.0>             | OSI definition and the Apache-2.0 fallback licence |

---

**Verification date for this entire document: 2026-11-13.** Re-verify anything
you rely on for a deadline — the rules page was last updated 7 August 2026
and the submission guide on 12 November 2026.
