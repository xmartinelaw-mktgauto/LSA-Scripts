(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - MINNESOTA LSA SERVICE AREAS
     INCLUDED AREAS ONLY
     =========================================================

     COUNTIES:
     ✓ Hennepin County
     ✓ Ramsey County
     ✓ Anoka County
     ✓ Washington County
     ✓ Dakota County
     ✓ Wright County
     ✓ Carver County
     ✓ Scott County

     CITIES:
     ✓ Minneapolis
     ✓ St. Paul
     ✓ Duluth
     ✓ Hutchinson
     ✓ Rochester

     IMPORTANT:
     - INCLUDE ONLY
     - Does NOT touch excluded service areas
     - Skips areas already added
     - Retries failed autocomplete searches
     - Pauses if page becomes hidden
     - Does NOT click Next
     - Starts automatically
     ========================================================= */


  /* =========================================================
     RUN LOCK
     ========================================================= */

  const LOCK = "__MARTINE_MN_LSA_SERVICE_AREA_RUNNING__";

  if (window[LOCK]) {
    console.warn("⚠ Minnesota Service Area automation is already running.");
    return;
  }

  window[LOCK] = true;


  /* =========================================================
     GLOBAL APP
     ========================================================= */

  window.MN_LSA = window.MN_LSA || {};
  const APP = window.MN_LSA;

  APP.stopRequested = false;


  /* =========================================================
     INCLUDED MINNESOTA SERVICE AREAS
     ========================================================= */

  APP.serviceAreas = [

    /* Counties */

    {
      name: "Hennepin County",
      type: "county",
      aliases: ["Hennepin County"]
    },

    {
      name: "Ramsey County",
      type: "county",
      aliases: ["Ramsey County"]
    },

    {
      name: "Anoka County",
      type: "county",
      aliases: ["Anoka County"]
    },

    {
      name: "Washington County",
      type: "county",
      aliases: ["Washington County"]
    },

    {
      name: "Dakota County",
      type: "county",
      aliases: ["Dakota County"]
    },

    {
      name: "Wright County",
      type: "county",
      aliases: ["Wright County"]
    },

    {
      name: "Carver County",
      type: "county",
      aliases: ["Carver County"]
    },

    {
      name: "Scott County",
      type: "county",
      aliases: ["Scott County"]
    },


    /* Cities */

    {
      name: "Minneapolis",
      type: "city",
      aliases: ["Minneapolis"]
    },

    {
      name: "St. Paul",
      type: "city",
      aliases: [
        "St. Paul",
        "Saint Paul",
        "St Paul"
      ]
    },

    {
      name: "Duluth",
      type: "city",
      aliases: ["Duluth"]
    },

    {
      name: "Hutchinson",
      type: "city",
      aliases: ["Hutchinson"]
    },

    {
      name: "Rochester",
      type: "city",
      aliases: ["Rochester"]
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
    betweenAreas: 500,
    betweenAttempts: 700,
    retryCooldown: 2500,
    maxPasses: 3,
    resumeDelay: 1000
  };


  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  APP.sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));


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

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  };


  APP.stop = () => {

    APP.stopRequested = true;

    console.warn(
      "🛑 Stop requested. Automation will stop at the next safe point."
    );
  };


  APP.checkStop = () => {

    if (APP.stopRequested) {
      throw new Error("Automation stopped manually.");
    }
  };


  /* =========================================================
     PAGE VISIBILITY SAFETY
     ========================================================= */

  APP.waitUntilVisible = async () => {

    APP.checkStop();

    if (!document.hidden) {
      return;
    }

    console.warn(
      "⏸ Minnesota LSA automation paused because this page is hidden."
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
    });

    console.log(
      "▶ Page visible again. Resuming..."
    );

    await APP.sleep(
      APP.settings.resumeDelay
    );
  };


  /* =========================================================
     FIND INCLUDE HEADING
     ========================================================= */

  APP.findIncludeHeading = () => {

    const target =
      "include these service areas";

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
          APP.normalize(element.textContent) === target
        );
      });

    if (!matches.length) {
      return null;
    }

    matches.sort((a, b) =>
      a.getBoundingClientRect().width -
      b.getBoundingClientRect().width
    );

    return matches[0];
  };


  /* =========================================================
     FIND INCLUDE INPUT ONLY
     ========================================================= */

  APP.getIncludeInput = () => {

    const heading =
      APP.findIncludeHeading();

    if (!heading) {

      console.error(
        '❌ Could not find "Include these service areas".'
      );

      return null;
    }

    const headingRect =
      heading.getBoundingClientRect();

    const inputs =
      Array.from(
        document.querySelectorAll(
          'input[type="text"], input[type="search"], input:not([type])'
        )
      )
      .filter(input =>
        APP.isVisible(input) &&
        !input.disabled &&
        !input.readOnly
      )
      .map(input => {

        const rect =
          input.getBoundingClientRect();

        return {
          input,
          distance:
            rect.top - headingRect.bottom
        };
      })
      .filter(item =>
        item.distance >= -5
      )
      .sort((a, b) =>
        a.distance - b.distance
      );

    return inputs.length
      ? inputs[0].input
      : null;
  };


  /* =========================================================
     REACT INPUT VALUE
     ========================================================= */

  APP.setInputValue = (
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


  APP.clearInput = async input => {

    if (!input) {
      return;
    }

    await APP.waitUntilVisible();

    input.focus();

    APP.setInputValue(
      input,
      ""
    );

    await APP.sleep(150);
  };


  /* =========================================================
     BUILD SEARCH ATTEMPTS
     ========================================================= */

  APP.getSearches = area => {

    if (area.type === "county") {

      return [
        `${area.name}, MN`,
        `${area.name}, Minnesota`,
        `${area.name.replace(/ County$/i, "")}, MN`
      ];
    }

    /*
     * St. Paul gets special aliases because Google may
     * return "Saint Paul".
     */

    const searches = [];

    area.aliases.forEach(alias => {

      searches.push(
        `${alias}, MN`
      );

      searches.push(
        `${alias}, Minnesota`
      );
    });

    return [
      ...new Set(searches)
    ];
  };


  /* =========================================================
     AUTOCOMPLETE OPTIONS
     ========================================================= */

  APP.getAutocompleteOptions = () => {

    const selectors = [
      '[role="option"]',
      '.pac-item',
      '.goog-menuitem',
      '[role="listbox"] li',
      '[role="listbox"] > div',
      '[data-value]'
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
     MATCH AUTOCOMPLETE RESULT
     ========================================================= */

  APP.findAutocompleteOption = area => {

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

        const matchesMinnesota =
          text.includes("minnesota") ||
          /\bmn\b/.test(text);

        return (
          matchesArea &&
          matchesMinnesota
        );
      });


    /*
     * Prefer shortest matching result.
     */

    matches.sort((a, b) =>

      APP.normalize(a.textContent).length -
      APP.normalize(b.textContent).length
    );


    return matches[0] || null;
  };


  /* =========================================================
     WAIT FOR AUTOCOMPLETE
     ========================================================= */

  APP.waitForAutocomplete =
    async area => {

      let remaining =
        APP.settings.autocompleteTimeout;

      while (
        remaining > 0
      ) {

        APP.checkStop();

        /*
         * Hidden time does not count against timeout.
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
          APP.settings.autocompletePoll
        );

        remaining -=
          APP.settings.autocompletePoll;
      }

      return null;
    };


  /* =========================================================
     DETECT WHETHER AREA IS ALREADY INCLUDED
     ========================================================= */

  APP.isAlreadyIncluded = area => {

    const heading =
      APP.findIncludeHeading();

    if (!heading) {
      return false;
    }

    const aliases =
      area.aliases.map(
        APP.normalize
      );

    const headingY =
      heading.getBoundingClientRect().top;

    const elements =
      Array.from(
        document.querySelectorAll(
          "div,span,button,li"
        )
      );

    return elements.some(element => {

      if (!APP.isVisible(element)) {
        return false;
      }

      /*
       * Ignore autocomplete.
       */

      if (
        element.closest(
          '[role="listbox"], .pac-container, .goog-menu'
        )
      ) {
        return false;
      }

      const text =
        APP.normalize(
          element.textContent
        );

      if (!text) {
        return false;
      }

      /*
       * Avoid huge containers.
       */

      if (text.length > 100) {
        return false;
      }

      const matches =
        aliases.some(alias =>
          text.includes(alias)
        );

      if (!matches) {
        return false;
      }

      const rect =
        element.getBoundingClientRect();

      return (
        rect.top > headingY
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
     ADD ONE SERVICE AREA
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
            `⚠ No Minnesota autocomplete result for ${area.name}`
          );

          await APP.clearInput(
            input
          );

          await APP.sleep(
            APP.settings.betweenAttempts
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
         * Verify it appears in Included areas.
         */

        for (
          let verify = 0;
          verify < 8;
          verify++
        ) {

          if (
            APP.isAlreadyIncluded(
              area
            )
          ) {

            console.log(
              `✅ Included: ${area.name}, Minnesota`
            );

            return "added";
          }

          await APP.sleep(250);
        }


        console.warn(
          `⚠ Clicked result but could not verify ${area.name}.`
        );
      }


      console.error(
        `❌ Failed: ${area.name}`
      );


      return "failed";
    };


  /* =========================================================
     PROCESS WITH RETRIES
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
          `🔄 MINNESOTA PASS ${pass}/${APP.settings.maxPasses}`
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
            APP.settings.betweenAreas
          );
        }


        remaining =
          failed;


        if (
          remaining.length &&
          pass < APP.settings.maxPasses
        ) {

          console.warn(
            "⏳ Retrying failed areas:",
            remaining.map(
              area => area.name
            )
          );

          await APP.sleep(
            APP.settings.retryCooldown
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


    console.log("");
    console.log(
      "============================================"
    );

    console.log(
      "📋 MINNESOTA FINAL AUDIT"
    );

    console.log(
      "============================================"
    );


    console.log(
      `Included service areas detected: ${
        APP.serviceAreas.length -
        missing.length
      } / ${APP.serviceAreas.length}`
    );


    if (!missing.length) {

      console.log(
        "✅ All 13 Minnesota service areas are included."
      );

    } else {

      console.warn(
        "⚠ Missing service areas:",
        missing.map(
          area => area.name
        )
      );
    }


    return {
      missing:
        missing.map(
          area => area.name
        )
    };
  };


  /* =========================================================
     RUN
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
        "   MINNESOTA LSA SERVICE AREAS"
      );

      console.log(
        "   INCLUDED AREAS ONLY"
      );

      console.log(
        "============================================"
      );


      console.log(
        "Counties: 8"
      );

      console.log(
        "Cities: 5"
      );

      console.log(
        "Total included areas: 13"
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


      await APP.sleep(500);


      const audit =
        APP.audit();


      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "🏁 MINNESOTA SERVICE AREA COMPLETE"
      );

      console.log(
        "============================================"
      );


      if (!audit.missing.length) {

        console.log(
          "✅ SUCCESS: 13 / 13 INCLUDED"
        );

      } else {

        console.warn(
          "⚠ Areas requiring review:",
          audit.missing
        );
      }


      console.log("");
      console.log(
        "🔒 No excluded areas were added."
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
          "🛑 Minnesota Service Area automation stopped."
        );

      } else {

        console.error(
          "❌ MINNESOTA LSA ERROR:",
          error
        );
      }

    } finally {

      window[LOCK] = false;
    }

  })();

})();
