# FORMA UI review

Scope: local frontend source, the supplied trainer screenshot, public page layouts and the member/admin components. This is a focused UI review, not a complete accessibility certification or a review of private production member data.

## Completed in this update

The home and Trainers pages now share distinct descriptions and training-focus tags for Tunde (lifting fundamentals and progressive strength), Amara (flexibility, breath awareness and balance), and Chidi (agility, coordination and conditioning). Identical years of experience, certification and review numbers were removed. No replacement credentials or client results were invented. Card content stretches consistently so booking actions remain aligned. Trainer booking and filters retain their existing behavior.

## Assessment

The dark palette, red actions, gold logo and warm photography give FORMA a coherent visual identity. The biggest improvement would come from clearer information and stronger hierarchy. Adding more animation or shadows everywhere would make essential actions harder to distinguish.

## Priority 1: Make the service credible and easy to understand

| Finding | Proposed improvement | Decision needed |
| --- | --- | --- |
| Premium and VIP currently render the same feature list, despite different prices. | Define the actual differences and show them in a concise comparison, with shared benefits grouped separately. | Owner must supply the real VIP extras; do not invent entitlements. |
| Memberships use NGN while product cards, bag and checkout show USD. | Use a consistent currency presentation across every price and checkout summary. | Confirm shop prices in naira; changing a symbol alone would misprice the products. |
| Contact details, class labels, booking times and admin tables use Brisbane/Australia. Some booking dates are fixed in code. | Configure the real gym location, operating hours and timezone, then show date-specific sessions. | Confirm the business location/timezone. The user's device timezone does not establish the gym's timezone. |
| Homepage member counts, years, testimonials and product review numbers are hardcoded. | Keep only verified claims; use real approved feedback and actual staff profiles before a commercial launch. | Owner supplies verified facts, real trainer photos/bios and permission to publish testimonials. |
| Privacy, Terms and social network names in the footer are plain text. | Make each item a working link, or remove it until its destination/content exists. | Supply the actual social pages and policies. |
| Most service cards send users to the same Workouts page. | Route each service to relevant information or the appropriate booking context. Personal training should take users to coaches. | Approve service-specific destinations before implementation. |

## Priority 2: Refine the layout and hierarchy

1. **Homepage:** reduce the number of equally prominent card sections. Lead with the hero and one primary membership action, then plan differences, services, coaches, verified proof and practical visit information. Keep shop and demo-app promotion lower in the hierarchy.
2. **Typography and spacing:** use consistent heading sizes, readable paragraph widths and a small spacing scale such as 8/16/24/32/48. Reserve small text for short metadata rather than essential instructions.
3. **Colour hierarchy:** reserve solid red for the most important action in each area. Use secondary buttons for supporting actions and gold sparingly for section markers. Avoid making every status green: pending, active and expired need distinct text and visual treatments.
4. **Trainer cards:** the current copy fix is complete. A future pass should add owner-approved, real profiles and keep photo crops consistent; the tablet CSS currently enlarges the last trainer image separately.
5. **Member dashboard:** make plan, status, exact expiry and days remaining the main overview. Show one context-sensitive next action (choose a plan, review a pending request, renew, or upgrade). Upgrade cards should show the actual benefit differences and prices rather than the same generic sentence.
6. **Admin dashboard:** use a focused management layout, a pending-review summary and compact tables. Keep the existing owner-only access rule. On phones, show labelled member summaries rather than relying entirely on horizontally scrolled tables. Provide filters and pagination as record counts grow.
7. **Account flow:** preserve the requested header without Sign in/Sign up links. Keep the account-form cross-links easy to find. Consider a small account progress indicator: create account, request plan, management review, active membership. Retain manual approval.

## Priority 3: Accessibility and perceived speed

- Audit small text against its actual background. The current `#81858e` fine-text colour against a `#1c1f25` panel endpoint calculates to about 4.46:1, slightly below the normal-text 4.5:1 threshold. Check all gradient positions and states rather than claiming the entire site passes or fails from that single pair. Reference: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Aim for comfortable 44px touch controls in the redesign. WCAG 2.2 AA's target-size requirement is 24px with defined spacing and other exceptions; 44px is a usability target here, not a claim about the minimum rule. Reference: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Keep visible keyboard focus, meaningful labels, inline errors and reduced-motion support. Give filters accessible selected states and verify dialog focus/return behavior.
- Add useful skeletons and retry states for session, pricing and dashboard loads. A Render free-service wake-up should not appear to be a broken form.
- Optimise the logo and content photography, provide appropriate image dimensions/responsive sources, and preserve click-to-load video. The current transparent logo is about 709KB and the video is about 4.16MB; these are file sizes, not measured performance scores.
- Replace placeholder question marks and inspect punctuation encoding in the homepage, reviews and contact content. Use icons for graphical symbols and clean UTF-8 text for punctuation.

## Suggested delivery order

1. Owner confirms business facts, shop prices, timezone and VIP differences.
2. Approve a homepage and member-dashboard layout direction before building it.
3. Implement shared typography, spacing, buttons and statuses, then apply those to the public pages and member dashboard.
4. Review the admin layout separately and keep role restrictions covered by tests.
5. Verify key journeys at phone/tablet/desktop sizes, keyboard navigation, contrast and production loading behavior.

Email verification/password recovery remain a later update. Sample classes and manual membership approval remain as previously agreed. Changes in the proposed sections above are recommendations, not implemented features.
