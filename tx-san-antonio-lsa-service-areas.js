(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - TEXAS / SAN ANTONIO LSA SERVICE AREAS
     INCLUDED AREAS ONLY
     =========================================================

     INCLUDED COUNTIES:
     ✓ Bexar County
     ✓ Comal County
     ✓ Guadalupe County
     ✓ Wilson County
     ✓ Kendall County
     ✓ Atascosa County
     ✓ Medina County
     ✓ Bandera County
     ✓ Hays County
     ✓ Karnes County
     ✓ Gonzales County
     ✓ Frio County

     IMPORTANT:
     - INCLUDE ONLY
     - Does NOT touch excluded service areas
     - Texas matches only
     - Skips counties already present
     - Retries autocomplete failures
     - Pauses if page becomes hidden
     - Does NOT click Next
     - Starts automatically
     ========================================================= */


  /* =========================================================
     RUN LOCK
     ========================================================= */

  const LOCK =
    "__MARTINE_TX_SAN_ANTONIO_LSA_RUNNING__";

  if (window[LOCK]) {
    console.warn(
      "⚠ San Antonio Service Area automation is already running."
    );
    return;
  }

  window[LOCK] = true;


  /* =========================================================
     GLOBAL APP
     ========================================================= */

  window.TX_SAN_ANTONIO_LSA =
    window.TX_SAN_ANTONIO_LSA || {};

  const APP =
    window.TX_SAN_ANTONIO_LSA;

  APP.stopRequested = false;


  /* =========================================================
     INCLUDED COUNTIES
     ========================================================= */

  APP.serviceAreas = [
    {
      name: "Bexar County",
      aliases: ["Bexar County"]
    },
    {
      name: "Comal County",
      aliases: ["Comal County"]
    },
    {
      name: "Guadalupe County",
      aliases: ["Guadalupe County"]
    },
    {
      name: "Wilson County",
      aliases: ["Wilson County"]
    },
    {
      name: "Kendall County",
      aliases: ["Kendall County"]
    },
    {
      name: "Atascosa County",
      aliases: ["Atascosa County"]
    },
    {
      name: "Medina County",
      aliases: ["Medina County"]
    },
    {
      name: "Bandera County",
      aliases: ["Bandera County"]
    },
    {
      name: "Hays County",
      aliases: ["Hays County"]
    },
    {
      name: "Karnes County",
      aliases: ["Karnes County"]
    },
    {
      name: "Gonzales County",
      aliases: ["Gonzales County"]
    },
    {
      name: "Frio County",
      aliases: ["Frio County"]
    }
  ];


  /* =========================================================
     SETTINGS
     ========================================================= */

  APP.settings = {
    autocompleteTimeout: 8000,
    autocompletePoll: 200,

    afterTyping: 450,
    afterSelection: 850,

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
    new Promise(resolve =>
      setTimeout(resolve, ms)
    );


  APP.normalize = text =>
    String(text || "")
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
      getComputedStyle(element);

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
     TX_SAN_ANTONIO_LSA.stop();

     if needed.
     ========================================================= */

  APP.stop = () => {

    APP.stopRequested = true;

    console.warn(
      "🛑 Stop requested. Automation will stop at the next safe point."
    );
  };


  APP.checkStop = () => {

    if (APP.stopRequested) {
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

      if (!document.hidden) {
        return;
      }

      console.warn(
        "⏸ San Antonio LSA automation paused because the page is hidden."
      );

      await new Promise(resolve => {

        const handler = () => {

          if (!document.hidden) {

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

        if (!document.hidden) {

          document.removeEventListener(
            "visibilitychange",
            handler
          );

          resolve();
        }
      });

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

  APP.findHeading = text => {

    const target =
      APP.normalize(text);

    const elements =
      Array.from(
        document.querySelectorAll(
          "div,span,label,p,h1,h2,h3,h4,h5,strong"
        )
      );

    const matches =
      elements.filter(element => {

        return (
          APP.isVisible(element) &&
          APP.normalize(
            element.textContent
          ) === target
        );
      });

    matches.sort((a, b) => {

      const ar =
        a.getBoundingClientRect();

      const br =
        b.getBoundingClientRect();

      return (
        ar.width * ar.height -
        br.width * br.height
      );
    });

    return matches[0] || null;
  };


  /* =========================================================
     FIND INCLUDE INPUT ONLY

     This specifically finds the input between:
     "Include these service areas"
     and
     "Exclude these service areas"

     So the exclude field is never touched.
     ========================================================= */

  APP.getIncludeInput = () => {

    const includeHeading =
      APP.findHeading(
        "Include these service areas"
      );

    if (!includeHeading) {

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
      .filter(input => {

        if (
          !APP.isVisible(input) ||
          input.disabled ||
          input.readOnly
        ) {
          return false;
        }


        const y =
          input
            .getBoundingClientRect()
            .top;


        return (
          y >= includeY - 10 &&
          y < excludeY
        );
      })
      .sort((a, b) => {

        return (
          a.getBoundingClientRect().top -
          b.getBoundingClientRect().top
        );
      });


    return inputs[0] || null;
  };


  /* =========================================================
     REACT INPUT VALUE
     ========================================================= */

  APP.setInputValue =
    (input, value) => {

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

        input.value = value;
      }


      if (input._valueTracker) {

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

      await APP.sleep(130);
    };


  /* =========================================================
     SEARCH TERMS
     ========================================================= */

  APP.getSearches = area => {

    const shortName =
      area.name.replace(
        / County$/i,
        ""
      );


    return [
      `${area.name}, TX`,
      `${area.name}, Texas`,
      `${shortName} County, TX`,
      `${shortName} County, Texas`
    ];
  };


  /* =========================================================
     AUTOCOMPLETE OPTIONS
     ========================================================= */

  APP.getAutocompleteOptions = () => {

    const selectors = [
      '[role="option"]',
      ".pac-item",
      ".goog-menuitem",
      '[role="listbox"] li',
      '[role="listbox"] > div',
      "[data-value]"
    ];


    const options = [];


    selectors.forEach(selector => {

      document
        .querySelectorAll(selector)
        .forEach(element => {

          if (APP.isVisible(element)) {
            options.push(element);
          }
        });
    });


    return [
      ...new Set(options)
    ];
  };


  /* =========================================================
     FIND PRECISE TEXAS AUTOCOMPLETE RESULT
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
        options.filter(option => {

          const text =
            APP.normalize(
              option.textContent
            );


          if (!text) {
            return false;
          }


          const countyMatch =
            aliases.some(alias =>
              text.includes(alias)
            );


          const texasMatch =
            (
              text.includes("texas") ||
              /\btx\b/.test(text)
            );


          return (
            countyMatch &&
            texasMatch
          );
        });


      /*
       * Prefer shortest / most precise match.
       */

      matches.sort((a, b) => {

        return (
          APP.normalize(
            a.textContent
          ).length -
          APP.normalize(
            b.textContent
          ).length
        );
      });


      return matches[0] || null;
    };


  /* =========================================================
     WAIT FOR AUTOCOMPLETE
     ========================================================= */

  APP.waitForAutocomplete =
    async area => {

      let remaining =
        APP.settings
          .autocompleteTimeout;


      while (remaining > 0) {

        APP.checkStop();

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
     CHECK IF COUNTY IS ALREADY INCLUDED
     ========================================================= */

  APP.isAlreadyIncluded =
    area => {

      const includeHeading =
        APP.findHeading(
          "Include these service areas"
        );


      if (!includeHeading) {
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


      return elements.some(element => {

        if (
          !APP.isVisible(element)
        ) {
          return false;
        }


        /*
         * Ignore autocomplete dropdown results.
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
          aliases.some(alias =>
            text.includes(alias)
          );


        if (!matches) {
          return false;
        }


        const y =
          element
            .getBoundingClientRect()
            .top;


        return (
          y >= includeY - 10 &&
          y < excludeY
        );
      });
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
     CLICK AUTOCOMPLETE
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
            `⚠ No precise Texas match for ${area.name}`
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
            option.textContent || ""
          )
            .replace(/\s+/g, " ")
            .trim()
        );


        await APP.clickOption(
          option
        );


        /*
         * Verify county was really added.
         */

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
              `✅ INCLUDED: ${area.name}, Texas`
            );

            return "added";
          }


          await APP.sleep(
            200
          );
        }


        console.warn(
          `⚠ Clicked result but could not verify ${area.name}.`
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
     PROCESS ALL COUNTIES
     ========================================================= */

  APP.process =
    async () => {

      let remaining =
        APP.serviceAreas.slice();


      const completed =
        new Set();


      for (
        let pass = 1;
        pass <= APP.settings.maxPasses;
        pass++
      ) {

        if (!remaining.length) {
          break;
        }


        console.log("");
        console.log(
          "============================================"
        );

        console.log(
          `🔄 SAN ANTONIO PASS ${pass}/${APP.settings.maxPasses}`
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
              area => area.name
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
            area => area.name
          )
      };
    };


  /* =========================================================
     FINAL AUDIT
     ========================================================= */

  APP.audit = () => {

    const missing =
      APP.serviceAreas.filter(
        area =>
          !APP.isAlreadyIncluded(
            area
          )
      );


    const includedCount =
      APP.serviceAreas.length -
      missing.length;


    console.log("");
    console.log(
      "============================================"
    );

    console.log(
      "📋 SAN ANTONIO FINAL AUDIT"
    );

    console.log(
      "============================================"
    );


    console.log(
      `Included counties detected: ${includedCount} / ${APP.serviceAreas.length}`
    );


    if (!missing.length) {

      console.log(
        "✅ All 12 San Antonio-area counties are included."
      );

    } else {

      console.warn(
        "⚠ Missing counties:",
        missing.map(
          area => area.name
        )
      );
    }


    return {
      includedCount,

      missing:
        missing.map(
          area => area.name
        )
    };
  };


  /* =========================================================
     MASTER RUN
     ========================================================= */

  APP.run =
    async () => {

      APP.stopRequested = false;

      console.clear();


      console.log(
        "============================================"
      );

      console.log(
        "🚀 MARTINE LAW"
      );

      console.log(
        "   TEXAS - SAN ANTONIO LSA"
      );

      console.log(
        "   INCLUDED AREAS ONLY"
      );

      console.log(
        "============================================"
      );


      console.log(
        `Included counties: ${APP.serviceAreas.length}`
      );


      const input =
        APP.getIncludeInput();


      if (!input) {

        throw new Error(
          'Could not locate the "Include these service areas" input.'
        );
      }


      console.log(
        "✅ Include field detected."
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
        "🏁 TEXAS - SAN ANTONIO COMPLETE"
      );

      console.log(
        "============================================"
      );


      if (
        audit.missing.length === 0
      ) {

        console.log(
          "✅ SUCCESS: 12 / 12 INCLUDED"
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
        processing,
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
          "🛑 San Antonio Service Area automation stopped."
        );

      } else {

        console.error(
          "❌ TEXAS SAN ANTONIO LSA ERROR:",
          error
        );
      }

    } finally {

      window[LOCK] = false;
    }

  })();

})();
