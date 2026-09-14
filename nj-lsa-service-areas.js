(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - NEW JERSEY LSA SERVICE AREAS
     INCLUDED AREAS ONLY
     =========================================================

     ✓ Essex County
     ✓ Union County
     ✓ Passaic County
     ✓ Bergen County
     ✓ Morris County
     ✓ Somerset County
     ✓ Middlesex County
     ✓ Monmouth County
     ✓ Mercer County
     ✓ Hunterdon County
     ✓ Ocean County
     ✓ Warren County
     ✓ Hudson County
     ✓ Sussex County

     IMPORTANT:
     - INCLUDE ONLY
     - Does NOT touch excluded service areas
     - Skips counties already added
     - Retries failed autocomplete searches
     - Matches NEW JERSEY / NJ only
     - Pauses if page becomes hidden
     - Does NOT click Next
     - Starts automatically
     ========================================================= */


  /* =========================================================
     RUN LOCK
     ========================================================= */

  const LOCK =
    "__MARTINE_NJ_LSA_SERVICE_AREA_RUNNING__";


  if (window[LOCK]) {
    console.warn(
      "⚠ New Jersey Service Area automation is already running."
    );
    return;
  }


  window[LOCK] = true;


  /* =========================================================
     GLOBAL APP
     ========================================================= */

  window.NJ_LSA =
    window.NJ_LSA || {};


  const APP =
    window.NJ_LSA;


  APP.stopRequested =
    false;


  /* =========================================================
     INCLUDED NEW JERSEY COUNTIES
     ========================================================= */

  APP.serviceAreas = [

    {
      name: "Essex County",
      aliases: ["Essex County"]
    },

    {
      name: "Union County",
      aliases: ["Union County"]
    },

    {
      name: "Passaic County",
      aliases: ["Passaic County"]
    },

    {
      name: "Bergen County",
      aliases: ["Bergen County"]
    },

    {
      name: "Morris County",
      aliases: ["Morris County"]
    },

    {
      name: "Somerset County",
      aliases: ["Somerset County"]
    },

    {
      name: "Middlesex County",
      aliases: ["Middlesex County"]
    },

    {
      name: "Monmouth County",
      aliases: ["Monmouth County"]
    },

    {
      name: "Mercer County",
      aliases: ["Mercer County"]
    },

    {
      name: "Hunterdon County",
      aliases: ["Hunterdon County"]
    },

    {
      name: "Ocean County",
      aliases: ["Ocean County"]
    },

    {
      name: "Warren County",
      aliases: ["Warren County"]
    },

    {
      name: "Hudson County",
      aliases: ["Hudson County"]
    },

    {
      name: "Sussex County",
      aliases: ["Sussex County"]
    }

  ];


  /* =========================================================
     SETTINGS
     ========================================================= */

  APP.settings = {

    autocompleteTimeout: 8000,

    autocompletePoll: 200,

    afterTyping: 500,

    afterSelection: 900,

    betweenAreas: 450,

    betweenAttempts: 650,

    retryCooldown: 2500,

    maxPasses: 3,

    resumeDelay: 900

  };


  /* =========================================================
     HELPERS
     ========================================================= */

  APP.sleep = ms =>
    new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms
        )
    );


  APP.normalize = text =>
    String(
      text || ""
    )
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim();


  APP.isVisible = element => {

    if (!element) {
      return false;
    }


    const rect =
      element.getBoundingClientRect();


    const style =
      getComputedStyle(
        element
      );


    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  };


  /* =========================================================
     STOP CONTROL

     Run:
     NJ_LSA.stop();

     if you need to stop it.
     ========================================================= */

  APP.stop = () => {

    APP.stopRequested =
      true;


    console.warn(
      "🛑 Stop requested. Automation will stop at the next safe point."
    );
  };


  APP.checkStop = () => {

    if (
      APP.stopRequested
    ) {

      throw new Error(
        "Automation stopped manually."
      );
    }
  };


  /* =========================================================
     BACKGROUND / VISIBILITY SAFETY
     ========================================================= */

  APP.waitUntilVisible =
    async () => {

      APP.checkStop();


      if (
        !document.hidden
      ) {

        return;
      }


      console.warn(
        "⏸ New Jersey LSA automation paused because the page is hidden."
      );


      await new Promise(
        resolve => {

          const handler =
            () => {

              if (
                !document.hidden
              ) {

                document.removeEventListener(
                  "visibilitychange",
                  handler
                );


                resolve();
              }
            };


          document.addEventListener(
            "visibilitychange",
            handler
          );


          if (
            !document.hidden
          ) {

            document.removeEventListener(
              "visibilitychange",
              handler
            );


            resolve();
          }
        }
      );


      console.log(
        "▶ Page visible again. Resuming..."
      );


      await APP.sleep(
        APP.settings.resumeDelay
      );
    };


  /* =========================================================
     FIND HEADING
     ========================================================= */

  APP.findHeading =
    text => {

      const target =
        APP.normalize(
          text
        );


      const elements =
        Array.from(
          document.querySelectorAll(
            "div,span,label,p,h1,h2,h3,h4,h5,strong"
          )
        );


      const matches =
        elements.filter(
          element => {

            return (
              APP.isVisible(
                element
              ) &&
              APP.normalize(
                element.textContent
              ) === target
            );
          }
        );


      matches.sort(
        (a, b) => {

          const ar =
            a.getBoundingClientRect();


          const br =
            b.getBoundingClientRect();


          return (
            ar.width * ar.height -
            br.width * br.height
          );
        }
      );


      return (
        matches[0] ||
        null
      );
    };


  /* =========================================================
     FIND INCLUDE INPUT ONLY

     IMPORTANT:
     Input must be below:
       "Include these service areas"

     and above:
       "Exclude these service areas"

     This prevents the script from ever using
     the excluded-area input.
     ========================================================= */

  APP.getIncludeInput =
    () => {

      const includeHeading =
        APP.findHeading(
          "Include these service areas"
        );


      if (
        !includeHeading
      ) {

        console.error(
          '❌ Could not find "Include these service areas".'
        );


        return null;
      }


      const excludeHeading =
        APP.findHeading(
          "Exclude these service areas"
        );


      const includeY =
        includeHeading
          .getBoundingClientRect()
          .bottom;


      const excludeY =
        excludeHeading
          ? excludeHeading
              .getBoundingClientRect()
              .top
          : Infinity;


      const inputs =
        Array.from(
          document.querySelectorAll(
            [
              'input[type="text"]',
              'input[type="search"]',
              'input:not([type])'
            ].join(",")
          )
        )
        .filter(
          input => {

            if (
              !APP.isVisible(
                input
              ) ||
              input.disabled ||
              input.readOnly
            ) {

              return false;
            }


            const rect =
              input.getBoundingClientRect();


            return (
              rect.top >=
                includeY - 10 &&
              rect.top <
                excludeY
            );
          }
        )
        .sort(
          (a, b) => {

            return (
              a.getBoundingClientRect().top -
              b.getBoundingClientRect().top
            );
          }
        );


      return (
        inputs[0] ||
        null
      );
    };


  /* =========================================================
     REACT INPUT VALUE
     ========================================================= */

  APP.setInputValue =
    (
      input,
      value
    ) => {

      const previous =
        input.value;


      const descriptor =
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        );


      if (
        descriptor &&
        descriptor.set
      ) {

        descriptor.set.call(
          input,
          value
        );

      } else {

        input.value =
          value;
      }


      if (
        input._valueTracker
      ) {

        input._valueTracker.setValue(
          previous
        );
      }


      input.dispatchEvent(
        new Event(
          "input",
          {
            bubbles: true
          }
        )
      );


      input.dispatchEvent(
        new Event(
          "change",
          {
            bubbles: true
          }
        )
      );
    };


  /* =========================================================
     CLEAR INPUT
     ========================================================= */

  APP.clearInput =
    async input => {

      if (!input) {
        return;
      }


      await APP.waitUntilVisible();


      input.focus();


      APP.setInputValue(
        input,
        ""
      );


      await APP.sleep(
        150
      );
    };


  /* =========================================================
     SEARCH TERMS

     Multiple versions help if Google autocomplete
     temporarily behaves differently.
     ========================================================= */

  APP.getSearches =
    area => {

      const shortName =
        area.name.replace(
          / County$/i,
          ""
        );


      return [

        `${area.name}, NJ`,

        `${area.name}, New Jersey`,

        `${shortName} County, NJ`,

        `${shortName} County, New Jersey`

      ];
    };


  /* =========================================================
     AUTOCOMPLETE OPTIONS
     ========================================================= */

  APP.getAutocompleteOptions =
    () => {

      const selectors = [

        '[role="option"]',

        ".pac-item",

        ".goog-menuitem",

        '[role="listbox"] li',

        '[role="listbox"] > div',

        "[data-value]"

      ];


      const options = [];


      selectors.forEach(
        selector => {

          document
            .querySelectorAll(
              selector
            )
            .forEach(
              element => {

                if (
                  APP.isVisible(
                    element
                  )
                ) {

                  options.push(
                    element
                  );
                }
              }
            );
        }
      );


      return [
        ...new Set(
          options
        )
      ];
    };


  /* =========================================================
     FIND PRECISE NEW JERSEY RESULT

     This protects Warren, Sussex, etc. from matching
     counties in other states.
     ========================================================= */

  APP.findAutocompleteOption =
    area => {

      const aliases =
        area.aliases.map(
          APP.normalize
        );


      const options =
        APP.getAutocompleteOptions();


      const matches =
        options.filter(
          option => {

            const text =
              APP.normalize(
                option.textContent
              );


            if (!text) {
              return false;
            }


            const matchesCounty =
              aliases.some(
                alias =>
                  text.includes(
                    alias
                  )
              );


            const matchesNJ =
              (
                text.includes(
                  "new jersey"
                ) ||
                /\bnj\b/.test(
                  text
                )
              );


            return (
              matchesCounty &&
              matchesNJ
            );
          }
        );


      /*
       * Prefer the shortest / most precise result.
       */

      matches.sort(
        (a, b) => {

          return (
            APP.normalize(
              a.textContent
            ).length -
            APP.normalize(
              b.textContent
            ).length
          );
        }
      );


      return (
        matches[0] ||
        null
      );
    };


  /* =========================================================
     WAIT FOR AUTOCOMPLETE
     ========================================================= */

  APP.waitForAutocomplete =
    async area => {

      let remaining =
        APP.settings
          .autocompleteTimeout;


      while (
        remaining > 0
      ) {

        APP.checkStop();


        /*
         * Hidden/background time does not count.
         */

        await APP.waitUntilVisible();


        const option =
          APP.findAutocompleteOption(
            area
          );


        if (option) {

          return option;
        }


        await APP.sleep(
          APP.settings
            .autocompletePoll
        );


        remaining -=
          APP.settings
            .autocompletePoll;
      }


      return null;
    };


  /* =========================================================
     CHECK IF COUNTY ALREADY INCLUDED
     ========================================================= */

  APP.isAlreadyIncluded =
    area => {

      const includeHeading =
        APP.findHeading(
          "Include these service areas"
        );


      if (
        !includeHeading
      ) {

        return false;
      }


      const excludeHeading =
        APP.findHeading(
          "Exclude these service areas"
        );


      const includeY =
        includeHeading
          .getBoundingClientRect()
          .bottom;


      const excludeY =
        excludeHeading
          ? excludeHeading
              .getBoundingClientRect()
              .top
          : Infinity;


      const aliases =
        area.aliases.map(
          APP.normalize
        );


      const elements =
        Array.from(
          document.querySelectorAll(
            "div,span,button,li"
          )
        );


      return elements.some(
        element => {

          if (
            !APP.isVisible(
              element
            )
          ) {

            return false;
          }


          /*
           * Never count autocomplete dropdown options.
           */

          if (
            element.closest(
              [
                '[role="listbox"]',
                ".pac-container",
                ".goog-menu"
              ].join(",")
            )
          ) {

            return false;
          }


          const text =
            APP.normalize(
              element.textContent
            );


          if (
            !text ||
            text.length > 100
          ) {

            return false;
          }


          const matches =
            aliases.some(
              alias =>
                text.includes(
                  alias
                )
            );


          if (!matches) {
            return false;
          }


          const rect =
            element.getBoundingClientRect();


          return (
            rect.top >=
              includeY - 10 &&
            rect.top <
              excludeY
          );
        }
      );
    };


  /* =========================================================
     TYPE SEARCH
     ========================================================= */

  APP.typeSearch =
    async (
      input,
      search
    ) => {

      await APP.waitUntilVisible();


      await APP.clearInput(
        input
      );


      input.scrollIntoView({
        block: "center",
        behavior: "auto"
      });


      input.focus();
      input.click();


      APP.setInputValue(
        input,
        search
      );


      /*
       * Keyboard activity helps trigger Google's
       * autocomplete listener.
       */

      input.dispatchEvent(
        new KeyboardEvent(
          "keydown",
          {
            key: "ArrowRight",
            code: "ArrowRight",
            bubbles: true
          }
        )
      );


      input.dispatchEvent(
        new KeyboardEvent(
          "keyup",
          {
            key: "ArrowRight",
            code: "ArrowRight",
            bubbles: true
          }
        )
      );


      await APP.sleep(
        APP.settings.afterTyping
      );
    };


  /* =========================================================
     CLICK AUTOCOMPLETE RESULT
     ========================================================= */

  APP.clickOption =
    async option => {

      await APP.waitUntilVisible();


      option.scrollIntoView({
        block: "nearest",
        behavior: "auto"
      });


      try {

        option.click();

      } catch (error) {

        option.dispatchEvent(
          new MouseEvent(
            "click",
            {
              bubbles: true,
              cancelable: true,
              view: window
            }
          )
        );
      }


      await APP.sleep(
        APP.settings.afterSelection
      );
    };


  /* =========================================================
     ADD ONE COUNTY
     ========================================================= */

  APP.addArea =
    async area => {

      APP.checkStop();


      await APP.waitUntilVisible();


      /* -----------------------------------------------------
         Already present
         ----------------------------------------------------- */

      if (
        APP.isAlreadyIncluded(
          area
        )
      ) {

        console.log(
          `⏭ Already included: ${area.name}`
        );


        return "already";
      }


      const searches =
        APP.getSearches(
          area
        );


      for (
        let attempt = 0;
        attempt < searches.length;
        attempt++
      ) {

        APP.checkStop();


        const input =
          APP.getIncludeInput();


        if (!input) {

          console.error(
            "❌ Cannot find Include service-area input."
          );


          return "error";
        }


        console.log(
          `🔎 ${area.name} | Attempt ${attempt + 1}/${searches.length}`
        );


        console.log(
          "   Search:",
          searches[attempt]
        );


        await APP.typeSearch(
          input,
          searches[attempt]
        );


        const option =
          await APP.waitForAutocomplete(
            area
          );


        if (!option) {

          console.warn(
            `⚠ No precise New Jersey match for ${area.name}`
          );


          await APP.clearInput(
            input
          );


          await APP.sleep(
            APP.settings
              .betweenAttempts
          );


          continue;
        }


        console.log(
          "🎯 Found:",
          String(
            option.textContent ||
            ""
          )
            .replace(
              /\s+/g,
              " "
            )
            .trim()
        );


        await APP.clickOption(
          option
        );


        /* ---------------------------------------------------
           Verify county was really added.
           --------------------------------------------------- */

        for (
          let verify = 0;
          verify < 10;
          verify++
        ) {

          if (
            APP.isAlreadyIncluded(
              area
            )
          ) {

            console.log(
              `✅ Included: ${area.name}, New Jersey`
            );


            return "added";
          }


          await APP.sleep(
            200
          );
        }


        console.warn(
          `⚠ Result was clicked but ${area.name} could not yet be verified.`
        );


        await APP.sleep(
          APP.settings
            .betweenAttempts
        );
      }


      console.error(
        `❌ Failed: ${area.name}`
      );


      return "failed";
    };


  /* =========================================================
     PROCESS ALL COUNTIES WITH RETRIES
     ========================================================= */

  APP.process =
    async () => {

      let remaining =
        APP.serviceAreas.slice();


      const completed =
        new Set();


      for (
        let pass = 1;
        pass <=
          APP.settings.maxPasses;
        pass++
      ) {

        if (
          !remaining.length
        ) {

          break;
        }


        console.log("");
        console.log(
          "============================================"
        );

        console.log(
          `🔄 NEW JERSEY PASS ${pass}/${APP.settings.maxPasses}`
        );

        console.log(
          `Counties remaining: ${remaining.length}`
        );

        console.log(
          "============================================"
        );


        const failed = [];


        for (
          let i = 0;
          i < remaining.length;
          i++
        ) {

          APP.checkStop();


          await APP.waitUntilVisible();


          const area =
            remaining[i];


          console.log("");
          console.log(
            `[${i + 1}/${remaining.length}] ${area.name}`
          );


          try {

            const status =
              await APP.addArea(
                area
              );


            if (
              status === "added" ||
              status === "already"
            ) {

              completed.add(
                area.name
              );

            } else {

              failed.push(
                area
              );
            }

          } catch (error) {

            console.error(
              `❌ ${area.name}:`,
              error
            );


            failed.push(
              area
            );
          }


          await APP.sleep(
            APP.settings
              .betweenAreas
          );
        }


        remaining =
          failed;


        if (
          remaining.length &&
          pass <
            APP.settings.maxPasses
        ) {

          console.warn(
            "⏳ Retrying failed counties:",
            remaining.map(
              area =>
                area.name
            )
          );


          await APP.sleep(
            APP.settings
              .retryCooldown
          );
        }
      }


      return {

        completed:
          Array.from(
            completed
          ),

        failed:
          remaining.map(
            area =>
              area.name
          )

      };
    };


  /* =========================================================
     FINAL AUDIT
     ========================================================= */

  APP.audit =
    () => {

      const missing =
        APP.serviceAreas.filter(
          area =>
            !APP.isAlreadyIncluded(
              area
            )
        );


      const count =
        APP.serviceAreas.length -
        missing.length;


      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "📋 NEW JERSEY FINAL AUDIT"
      );

      console.log(
        "============================================"
      );


      console.log(
        `Included counties detected: ${count} / ${APP.serviceAreas.length}`
      );


      if (
        !missing.length
      ) {

        console.log(
          "✅ All 14 New Jersey counties are included."
        );

      } else {

        console.warn(
          "⚠ Missing counties:",
          missing.map(
            area =>
              area.name
          )
        );
      }


      return {

        count:
          count,

        missing:
          missing.map(
            area =>
              area.name
          )

      };
    };


  /* =========================================================
     MASTER RUN
     ========================================================= */

  APP.run =
    async () => {

      APP.stopRequested =
        false;


      console.clear();


      console.log(
        "============================================"
      );

      console.log(
        "🚀 MARTINE LAW"
      );

      console.log(
        "   NEW JERSEY LSA SERVICE AREAS"
      );

      console.log(
        "   INCLUDED ONLY"
      );

      console.log(
        "============================================"
      );


      console.log(
        "Total included counties:",
        APP.serviceAreas.length
      );


      const input =
        APP.getIncludeInput();


      if (!input) {

        throw new Error(
          'Could not locate the "Include these service areas" input.'
        );
      }


      console.log(
        "✅ Include service-area field detected."
      );


      console.log(
        "🔒 Excluded service areas will NOT be touched."
      );


      const processing =
        await APP.process();


      await APP.sleep(
        400
      );


      const audit =
        APP.audit();


      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "🏁 NEW JERSEY SERVICE AREA COMPLETE"
      );

      console.log(
        "============================================"
      );


      if (
        audit.missing.length === 0
      ) {

        console.log(
          "✅ SUCCESS: 14 / 14 INCLUDED"
        );

      } else {

        console.warn(
          "⚠ Counties requiring review:",
          audit.missing
        );
      }


      console.log("");
      console.log(
        "🔒 No excluded service areas were added."
      );


      console.log(
        "🔒 Next was NOT clicked."
      );


      return {
        processing:
          processing,

        audit:
          audit
      };
    };


  /* =========================================================
     AUTO START
     ========================================================= */

  (async () => {

    try {

      await APP.run();

    } catch (error) {

      if (
        APP.stopRequested
      ) {

        console.warn(
          "🛑 New Jersey Service Area automation stopped."
        );

      } else {

        console.error(
          "❌ NEW JERSEY LSA ERROR:",
          error
        );
      }

    } finally {

      window[LOCK] =
        false;
    }

  })();

})();
