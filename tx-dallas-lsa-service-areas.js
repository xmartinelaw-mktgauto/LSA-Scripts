(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - TEXAS / DALLAS LSA SERVICE AREAS
     =========================================================

     MARKET:
     DALLAS

     INCLUDED COUNTIES:
     ✓ Dallas County
     ✓ Tarrant County
     ✓ Collin County
     ✓ Denton County
     ✓ Rockwall County
     ✓ Kaufman County
     ✓ Ellis County
     ✓ Johnson County
     ✓ Parker County
     ✓ Wise County
     ✓ Hunt County
     ✓ Navarro County

     EXCLUDED CITIES:
     ✓ Waco
     ✓ Tyler

     IMPORTANT:
     - Adds INCLUDED areas to "Include these service areas"
     - Adds EXCLUDED areas to "Exclude these service areas"
     - Texas matches only
     - Skips areas already present
     - Retries failed autocomplete searches
     - Pauses when page becomes hidden
     - Does NOT click Next
     - Starts automatically
     ========================================================= */


  /* =========================================================
     RUN LOCK
     ========================================================= */

  const LOCK =
    "__MARTINE_TX_DALLAS_LSA_RUNNING__";

  if (window[LOCK]) {
    console.warn(
      "⚠ Texas Dallas Service Area automation is already running."
    );
    return;
  }

  window[LOCK] = true;


  /* =========================================================
     GLOBAL APP
     ========================================================= */

  window.TX_DALLAS_LSA =
    window.TX_DALLAS_LSA || {};

  const APP =
    window.TX_DALLAS_LSA;

  APP.stopRequested = false;


  /* =========================================================
     INCLUDED SERVICE AREAS
     ========================================================= */

  APP.includedAreas = [
    {
      name: "Dallas County",
      type: "county",
      aliases: ["Dallas County"]
    },
    {
      name: "Tarrant County",
      type: "county",
      aliases: ["Tarrant County"]
    },
    {
      name: "Collin County",
      type: "county",
      aliases: ["Collin County"]
    },
    {
      name: "Denton County",
      type: "county",
      aliases: ["Denton County"]
    },
    {
      name: "Rockwall County",
      type: "county",
      aliases: ["Rockwall County"]
    },
    {
      name: "Kaufman County",
      type: "county",
      aliases: ["Kaufman County"]
    },
    {
      name: "Ellis County",
      type: "county",
      aliases: ["Ellis County"]
    },
    {
      name: "Johnson County",
      type: "county",
      aliases: ["Johnson County"]
    },
    {
      name: "Parker County",
      type: "county",
      aliases: ["Parker County"]
    },
    {
      name: "Wise County",
      type: "county",
      aliases: ["Wise County"]
    },
    {
      name: "Hunt County",
      type: "county",
      aliases: ["Hunt County"]
    },
    {
      name: "Navarro County",
      type: "county",
      aliases: ["Navarro County"]
    }
  ];


  /* =========================================================
     EXCLUDED SERVICE AREAS
     ========================================================= */

  APP.excludedAreas = [
    {
      name: "Waco",
      type: "city",
      aliases: ["Waco"]
    },
    {
      name: "Tyler",
      type: "city",
      aliases: ["Tyler"]
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

    betweenSections: 1800,
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
     TX_DALLAS_LSA.stop();

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
        "⏸ Dallas LSA automation paused because this page is hidden."
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
     FIND SECTION HEADING
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
     FIND INPUT FOR INCLUDE OR EXCLUDE SECTION
     ========================================================= */

  APP.getSectionInput = type => {

    const includeHeading =
      APP.findHeading(
        "Include these service areas"
      );

    const excludeHeading =
      APP.findHeading(
        "Exclude these service areas"
      );


    if (!includeHeading) {

      console.error(
        '❌ Could not find "Include these service areas".'
      );

      return null;
    }


    if (!excludeHeading) {

      console.error(
        '❌ Could not find "Exclude these service areas".'
      );

      return null;
    }


    const includeY =
      includeHeading
        .getBoundingClientRect()
        .bottom;

    const excludeY =
      excludeHeading
        .getBoundingClientRect()
        .top;


    let inputs =
      Array.from(
        document.querySelectorAll(
          [
            'input[type="text"]',
            'input[type="search"]',
            'input:not([type])'
          ].join(",")
        )
      )
      .filter(input =>
        APP.isVisible(input) &&
        !input.disabled &&
        !input.readOnly
      )
      .map(input => ({
        input,
        y:
          input
            .getBoundingClientRect()
            .top
      }));


    if (type === "include") {

      inputs =
        inputs.filter(item =>
          item.y >= includeY - 10 &&
          item.y < excludeY
        );

      inputs.sort(
        (a, b) =>
          Math.abs(a.y - includeY) -
          Math.abs(b.y - includeY)
      );

    } else {

      inputs =
        inputs.filter(item =>
          item.y >= excludeY
        );

      inputs.sort(
        (a, b) =>
          Math.abs(a.y - excludeY) -
          Math.abs(b.y - excludeY)
      );
    }


    return inputs.length
      ? inputs[0].input
      : null;
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

    if (area.type === "county") {

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
    }


    /*
     * Cities
     */

    return [
      `${area.name}, TX`,
      `${area.name}, Texas`
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


          const matchesArea =
            aliases.some(alias =>
              text.includes(alias)
            );


          const matchesTexas =
            (
              text.includes("texas") ||
              /\btx\b/.test(text)
            );


          return (
            matchesArea &&
            matchesTexas
          );
        });


      /*
       * Prefer shortest / most exact match.
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
     CHECK IF AREA ALREADY EXISTS IN CORRECT SECTION
     ========================================================= */

  APP.isAlreadySelected =
    (area, type) => {

      const includeHeading =
        APP.findHeading(
          "Include these service areas"
        );

      const excludeHeading =
        APP.findHeading(
          "Exclude these service areas"
        );


      if (
        !includeHeading ||
        !excludeHeading
      ) {

        return false;
      }


      const includeY =
        includeHeading
          .getBoundingClientRect()
          .bottom;

      const excludeY =
        excludeHeading
          .getBoundingClientRect()
          .top;


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
         * Ignore autocomplete dropdown.
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


        if (type === "include") {

          return (
            y >= includeY - 10 &&
            y < excludeY
          );
        }


        return (
          y >= excludeY
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


      /*
       * Helps trigger Google's autocomplete.
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
     ADD ONE AREA
     ========================================================= */

  APP.addArea =
    async (
      area,
      type
    ) => {

      APP.checkStop();

      await APP.waitUntilVisible();


      if (
        APP.isAlreadySelected(
          area,
          type
        )
      ) {

        console.log(
          `⏭ Already ${type === "include" ? "included" : "excluded"}: ${area.name}`
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

        const input =
          APP.getSectionInput(
            type
          );


        if (!input) {

          console.error(
            `❌ Cannot find ${type.toUpperCase()} service-area input.`
          );

          return "error";
        }


        console.log(
          `🔎 ${type.toUpperCase()} | ${area.name} | Attempt ${attempt + 1}/${searches.length}`
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
         * Verify it actually appeared.
         */

        for (
          let verify = 0;
          verify < 10;
          verify++
        ) {

          if (
            APP.isAlreadySelected(
              area,
              type
            )
          ) {

            console.log(
              type === "include"
                ? `✅ INCLUDED: ${area.name}, Texas`
                : `🚫 EXCLUDED: ${area.name}, Texas`
            );


            return "added";
          }


          await APP.sleep(200);
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
        `❌ Failed ${type.toUpperCase()}: ${area.name}`
      );


      return "failed";
    };


  /* =========================================================
     PROCESS LIST WITH RETRIES
     ========================================================= */

  APP.processList =
    async (
      areas,
      type
    ) => {

      let remaining =
        areas.slice();


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
          `🔄 ${type.toUpperCase()} PASS ${pass}/${APP.settings.maxPasses}`
        );

        console.log(
          `Areas remaining: ${remaining.length}`
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
                area,
                type
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
            "⏳ Retrying failed areas:",
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

    const missingIncluded =
      APP.includedAreas.filter(
        area =>
          !APP.isAlreadySelected(
            area,
            "include"
          )
      );


    const missingExcluded =
      APP.excludedAreas.filter(
        area =>
          !APP.isAlreadySelected(
            area,
            "exclude"
          )
      );


    console.log("");
    console.log(
      "============================================"
    );

    console.log(
      "📋 DALLAS TEXAS FINAL AUDIT"
    );

    console.log(
      "============================================"
    );


    console.log(
      `Included counties: ${
        APP.includedAreas.length -
        missingIncluded.length
      } / ${APP.includedAreas.length}`
    );


    console.log(
      `Excluded cities: ${
        APP.excludedAreas.length -
        missingExcluded.length
      } / ${APP.excludedAreas.length}`
    );


    if (!missingIncluded.length) {

      console.log(
        "✅ All 12 Dallas-area counties included."
      );

    } else {

      console.warn(
        "⚠ Missing INCLUDED counties:",
        missingIncluded.map(
          area => area.name
        )
      );
    }


    if (!missingExcluded.length) {

      console.log(
        "✅ Waco and Tyler excluded."
      );

    } else {

      console.warn(
        "⚠ Missing EXCLUDED areas:",
        missingExcluded.map(
          area => area.name
        )
      );
    }


    return {
      missingIncluded:
        missingIncluded.map(
          area => area.name
        ),

      missingExcluded:
        missingExcluded.map(
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
        "   TEXAS - DALLAS LSA SERVICE AREAS"
      );

      console.log(
        "============================================"
      );


      console.log(
        `Included counties: ${APP.includedAreas.length}`
      );

      console.log(
        `Excluded cities: ${APP.excludedAreas.length}`
      );


      const includeInput =
        APP.getSectionInput(
          "include"
        );


      const excludeInput =
        APP.getSectionInput(
          "exclude"
        );


      if (!includeInput) {

        throw new Error(
          'Could not locate the "Include these service areas" input.'
        );
      }


      if (!excludeInput) {

        throw new Error(
          'Could not locate the "Exclude these service areas" input.'
        );
      }


      console.log(
        "✅ Include field detected."
      );

      console.log(
        "✅ Exclude field detected."
      );


      /* =====================================================
         STEP 1
         INCLUDED COUNTIES
         ===================================================== */

      console.log("");
      console.log(
        "############################################"
      );

      console.log(
        "STEP 1 OF 2"
      );

      console.log(
        "ADDING DALLAS INCLUDED COUNTIES"
      );

      console.log(
        "############################################"
      );


      const includeResult =
        await APP.processList(
          APP.includedAreas,
          "include"
        );


      await APP.sleep(
        APP.settings
          .betweenSections
      );


      /* =====================================================
         STEP 2
         EXCLUDED CITIES
         ===================================================== */

      console.log("");
      console.log(
        "############################################"
      );

      console.log(
        "STEP 2 OF 2"
      );

      console.log(
        "ADDING DALLAS EXCLUDED CITIES"
      );

      console.log(
        "############################################"
      );


      const excludeResult =
        await APP.processList(
          APP.excludedAreas,
          "exclude"
        );


      /* =====================================================
         FINAL AUDIT
         ===================================================== */

      await APP.sleep(500);


      const audit =
        APP.audit();


      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "🏁 TEXAS - DALLAS SERVICE AREA COMPLETE"
      );

      console.log(
        "============================================"
      );


      if (
        !audit.missingIncluded.length &&
        !audit.missingExcluded.length
      ) {

        console.log(
          "✅ SUCCESS"
        );

        console.log(
          "✅ 12 / 12 INCLUDED COUNTIES"
        );

        console.log(
          "✅ 2 / 2 EXCLUDED CITIES"
        );

      } else {

        console.warn(
          "⚠ Some areas require review."
        );
      }


      console.log("");
      console.log(
        "🔒 Next was NOT clicked."
      );


      return {
        includeResult,
        excludeResult,
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
          "🛑 Dallas Service Area automation stopped."
        );

      } else {

        console.error(
          "❌ TEXAS DALLAS LSA ERROR:",
          error
        );
      }

    } finally {

      window[LOCK] = false;
    }

  })();

})();
