/**
 * @license
 * All Rights Reserved.
 */

/**
 * About tab — static project info, credits, and the EULA. Extracted from
 * App.tsx to keep the main component lean. Takes only the app version.
 */
export default function AboutPanel({ appVersion }: { appVersion: string }) {
  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-300 text-justify">
          About
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed text-justify">
          <span className="text-pink-400 font-bold">Milkshake Mania</span> is an{" "}
          <span className="text-orange-400">incremental, clicker-like</span>{" "}
          game built with <span className="text-cyan-300">React + Vite</span>.
          It features <span className="text-orange-400">manual blending</span>,{" "}
          <span className="text-lime-400">passive income</span> from{" "}
          <span className="text-cyan-400">employees</span>, and a variety of{" "}
          <span className="text-orange-400">upgrades</span> and{" "}
          <span className="text-orange-400">special outcomes</span>. This
          experience allows you to create your own{" "}
          <span className="text-lime-400 font-medium">milkshake empire</span>,
          starting from a small shop and building your{" "}
          <span className="text-lime-400 font-medium">empire</span> through
          blends, staff, and expansion.
        </p>
        <p className="text-xs text-lime-300">Version: {appVersion}</p>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400">
          Credits
        </h3>
        <div className="text-xs text-neutral-300 leading-relaxed text-justify">
          <p className="text-indigo-400">
            UI design, original music, and game logic brought together by the{" "}
            <strong className="text-indigo-300 font-bold">
              Strider657's Milkshake Mania
            </strong>{" "}
            team.
          </p>

          <hr className="my-3 border-neutral-700" />

          <div className="text-center space-y-1">
            <strong className="block text-cyan-400">
              Lead Developer, Solo Composer & First Playtester
            </strong>
            <div className="text-cyan-200 font-medium">Strider657</div>
          </div>

          <hr className="my-3 border-neutral-700" />

          <div className="text-center space-y-1">
            <strong className="block text-amber-400">
              Lead Concept Designer & Second Playtester
            </strong>
            <div className="text-amber-200 font-medium">Oliver382</div>
          </div>

          <hr className="my-3 border-neutral-700" />

          <div className="space-y-2">
            <strong className="block text-center text-lime-400">
              The Alpha (and release) Playtesters
            </strong>
            <div className="text-justify text-neutral-300 bg-neutral-900/30 p-2 rounded border border-neutral-800/50 space-y-1">
              <div>
                • <span className="text-blue-300 font-medium">Strider657</span>:
                First ever playtester and lead game developer.
              </div>
              <div>
                • <span className="text-blue-300 font-medium">Oliver382</span>:
                Second ever playtester and lead concept designer.
              </div>
              <div>
                • <span className="text-lime-300 font-medium">Reuben G.</span>:
                Third ever playtester. Provided highly valuable balancing and
                GUI feedback.
              </div>
              <div>
                • <span className="text-lime-300 font-medium">Max L.</span>:
                Fourth ever playtester. Gave a lot of feedback with gameplay.
              </div>
            </div>
          </div>

          <hr className="my-3 border-neutral-700" />

          <div className="text-justify space-y-2 pt-1">
            <p className="text-lime-400 font-medium">
              Huge thanks to everyone who contributed to this project!
            </p>
            <p>
              Special shoutout to{" "}
              <span className="text-amber-400 font-medium">Oliver382</span> for
              bringing so many creative ideas and shaping the gameplay and
              features of{" "}
              <span className="text-indigo-300 font-bold">Milkshake Mania</span>
              . This message was written by the creator, himself—more
              accurately, <em className="text-cyan-400">myself</em>,{" "}
              <strong className="text-cyan-300 font-bold">Strider657</strong>
              —and it's been awesome collaborating with him on the game's design
              and overall vision.
              <span className="text-amber-400 font-medium"> Oliver382</span> was
              important playtesting the early versions and providing game
              concepts and ideas, including the entire (most) game concept.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-300">
          Legal (EULA)
        </h3>

        <p className="text-xs text-neutral-300 leading-relaxed text-justify">
          END USER LICENSE AGREEMENT (EULA)
          <br />
          <br />
          Effective Date: January 1, 2026
          <br />
          Copyright © 2026 Strider657. All Rights Reserved.
          <br />
          <br />
          This End User License Agreement ("Agreement") is a legal agreement
          between you ("User", "you") and Strider657 ("Licensor", "we", "our",
          or "us") governing the use of the software product known as "Milkshake
          Mania" (the "Software").
          <br />
          <br />
          BY INSTALLING, ACCESSING, COPYING, DOWNLOADING, LAUNCHING, OR USING
          THE SOFTWARE IN ANY WAY, YOU AGREE TO BE BOUND BY THE TERMS OF THIS
          AGREEMENT. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT INSTALL OR USE
          THE SOFTWARE.
          <br />
          <br />
          1. OWNERSHIP
          <br />
          <br />
          The Software and all associated content, including but not limited to
          source code, compiled binaries, assets, textures, models, animations,
          music, sound effects, dialogue, visual designs, UI/UX elements,
          systems, mechanics, scripts, documentation, branding, and related
          materials are and shall remain the exclusive intellectual property of
          Strider657 and are protected under applicable copyright, trademark,
          and intellectual property laws.
          <br />
          <br />
          No ownership rights are transferred to you under this Agreement.
          <br />
          <br />
          1A. MUSIC / AUDIO ASSETS
          <br />
          <br />
          All music, sound recordings, sound effects, and audio files included
          with the Software (including any files located in an "assets/music" or
          similar folder) are part of the Software and are protected works. You
          may not extract, separate, rip, download, re-upload, copy, distribute,
          publicly perform, or otherwise reuse any audio assets outside the
          Software, except where you have separately obtained explicit written
          permission from Strider657 (or where such restriction is prohibited by
          applicable law).
          <br />
          <br />
          2. LIMITED LICENSE
          <br />
          <br />
          Subject to your compliance with this Agreement, Strider657 grants you
          a limited, revocable, non-exclusive, non-transferable,
          non-sublicensable license to install and use one copy of the Software
          solely for personal, non-commercial entertainment purposes.
          <br />
          <br />
          3. RESTRICTIONS
          <br />
          <br />
          You may NOT, without prior written permission from Strider657:
          <br />
          - Copy, reproduce, distribute, republish, or redistribute the Software
          or any component thereof
          <br />
          - Modify, adapt, translate, patch, or create derivative works based on
          the Software
          <br />
          - Sell, rent, lease, sublicense, monetize, or commercially exploit the
          Software
          <br />
          - Reverse engineer, decompile, disassemble, or attempt to derive the
          source code, algorithms, or underlying systems of the Software, except
          where expressly permitted by applicable law
          <br />
          - Remove, alter, or obscure any copyright, trademark, or proprietary
          notices
          <br />
          - Upload, mirror, host, or redistribute the Software on third-party
          platforms under any name other than the official release
          <br />
          - Use the Software for unlawful, harmful, fraudulent, or malicious
          purposes
          <br />
          - Circumvent, disable, or interfere with security features,
          authentication systems, or technical protections used by the Software
          <br />
          <br />
          3A. MODS / USER-MADE CONTENT (IF EVER SUPPORTED)
          <br />
          <br />
          If the Software ever supports mods, plug-ins, add-ons, user-made
          levels, or any other user-made content ("Mods"), then:
          <br />
          - Mods must be free of charge. Paid Mods, paywalled content,
          subscriptions, or "premium" unlocks are not permitted.
          <br />
          - Ads are not permitted in or via Mods (including ad SDKs, affiliate
          links, ad overlays, sponsored placements, or any other advertising or
          promotional monetization).
          <br />
          - In-app purchases and paid digital content are not permitted via the
          Software or via Mods (including purchase flows, external stores,
          microtransactions, tips, donations, or any mechanism that results in
          the user paying money for content, features, access, currency, or
          progression).
          <br />
          - Mods may not require or encourage payment to access gameplay
          content, features, or progression, whether inside the Software or via
          external links.
          <br />
          - Strider657 may remove, disable, or block any Mod at any time and for
          any reason, including for violations of this Agreement.
          <br />
          <br />
          4. USER CONTENT
          <br />
          <br />
          If the Software permits the creation or sharing of user-generated
          content, you retain ownership of your original content. However, by
          submitting or sharing such content through the Software, you grant
          Strider657 a worldwide, non-exclusive, royalty-free license to host,
          display, reproduce, and distribute that content solely for operation,
          promotion, and improvement of the Software.
          <br />
          <br />
          You are solely responsible for any content you create or share.
          <br />
          <br />
          5. UPDATES AND MODIFICATIONS
          <br />
          <br />
          Strider657 may update, patch, modify, suspend, or discontinue the
          Software or any online functionality at any time without notice or
          liability.
          <br />
          <br />
          6. TERMINATION
          <br />
          <br />
          This Agreement automatically terminates if you violate any provision
          of this Agreement. Upon termination, you must immediately cease all
          use of the Software and delete all copies in your possession or
          control.
          <br />
          <br />
          7. DISCLAIMER OF WARRANTIES
          <br />
          <br />
          THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES
          OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          TITLE, NON-INFRINGEMENT, OR THAT THE SOFTWARE WILL BE UNINTERRUPTED OR
          ERROR-FREE.
          <br />
          <br />
          8. LIMITATION OF LIABILITY
          <br />
          <br />
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, STRIDER657 SHALL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR
          PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, LOSS OF PROFITS, BUSINESS
          INTERRUPTION, OR SYSTEM FAILURE ARISING FROM OR RELATED TO USE OF THE
          SOFTWARE.
          <br />
          <br />
          9. INDEMNIFICATION
          <br />
          <br />
          You agree to indemnify and hold harmless Strider657 from any claims,
          liabilities, damages, losses, or expenses arising from your misuse of
          the Software or violation of this Agreement.
          <br />
          <br />
          10. GOVERNING LAW
          <br />
          <br />
          This Agreement shall be governed and interpreted in accordance with
          the laws applicable in the Licensor's jurisdiction, without regard to
          conflict of law principles.
          <br />
          <br />
          11. ENTIRE AGREEMENT
          <br />
          <br />
          This Agreement constitutes the complete and exclusive agreement
          between you and Strider657 regarding the Software and supersedes all
          prior agreements or understandings.
          <br />
          <br />
          All rights not expressly granted herein are reserved exclusively by
          Strider657.
          <br />
          <br />
          Copyright © 2026 Strider657. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
