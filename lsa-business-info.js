(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - GOOGLE LSA BUSINESS INFO
     DYNAMIC ALL-TABS VERSION
     =========================================================

     Automatically detects ALL available tabs.

     Example:
     ✓ Criminal Lawyer
     ✓ DUI Lawyer
     ✓ Family Lawyer
     ✓ Lawyer
     ✓ Traffic Lawyer
     ✓ Any additional Google category

     EXACTLY THESE 6 ON EVERY TAB:

     ✓ Evening appointment by request
     ✓ Speaks Spanish
     ✓ Weekend appointment by request
     ✓ Veteran-owned & operated
     ✓ Minority-owned & operated
     ✓ Accepting new clients

     IMPORTANT:
     - No hardcoded tab count
     - Handles 4, 5, 6+ tabs
     - Processes tabs in displayed order
     - Removes other selected highlights
     - Does NOT click SAVE
     ========================================================= */


  const LOCK =
    "__MARTINE_LSA_BUSINESS_INFO_DYNAMIC__";


  if (window[LOCK]) {
    console.warn(
      "⚠ Business Info automation is already running."
    );
    return;
  }


  window[LOCK] = true;


  window.LSA_INFO =
    window.LSA_INFO || {};


  const APP =
    window.LSA_INFO;


  APP.stopRequested = false;


  /* =========================================================
     REQUIRED HIGHLIGHTS
     ========================================================= */

  APP.required = [
    "Evening appointment by request",
    "Speaks Spanish",
    "Weekend appointment by request",
    "Veteran-owned & operated",
    "Minority-owned & operated",
    "Accepting new clients"
  ];


  APP.requiredSet =
    new Set();


  /* =========================================================
     SPEED SETTINGS
     ========================================================= */

  APP.settings = {
    tabWait: 350,
    clickWait: 70,
    stateTimeout: 500,
    statePoll: 20,
    betweenTabs: 120
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
      .replace(/&amp;/g, "&")
      .replace(/\s*&\s*/g, " and ")
      .replace(/\s+/g, " ")
      .trim();


  APP.required.forEach(name => {
    APP.requiredSet.add(
      APP.normalize(name)
    );
  });


  APP.rendered = element => {

    if (!element) {
      return false;
    }


    const style =
      getComputedStyle(element);


    const rect =
      element.getBoundingClientRect();


    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  };


  /* =========================================================
     STOP
     ========================================================= */

  APP.stop = () => {

    APP.stopRequested = true;

    console.warn(
      "🛑 Stop requested."
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
     BUSINESS INFO MODAL
     ========================================================= */

  APP.getModal = () => {

    const dialogs =
      Array.from(
        document.querySelectorAll(
          '[role="dialog"], [aria-modal="true"]'
        )
      );


    let modal =
      dialogs.find(dialog => {

        const text =
          APP.normalize(
            dialog.textContent
          );


        return (
          text.includes("business info") &&
          text.includes("select up to 6 things")
        );
      });


    if (modal) {
      return modal;
    }


    /*
     * Fallback for Google's custom modal.
     */

    const candidates =
      Array.from(
        document.querySelectorAll("div")
      )
      .filter(element => {

        const text =
          APP.normalize(
            element.textContent
          );


        return (
          text.includes("business info") &&
          text.includes("select up to 6 things") &&
          text.includes("save")
        );
      });


    candidates.sort((a, b) => {

      const ar =
        a.getBoundingClientRect();


      const br =
        b.getBoundingClientRect();


      return (
        ar.width * ar.height -
        br.width * br.height
      );
    });


    return candidates[0] || null;
  };


  /* =========================================================
     AUTOMATIC TAB DISCOVERY

     NO TAB NAMES ARE HARDCODED.
     ========================================================= */

  APP.getTabs = () => {

    const modal =
      APP.getModal();


    if (!modal) {
      return [];
    }


    /* -----------------------------------------------------
       Preferred: actual ARIA tabs
       ----------------------------------------------------- */

    let tabs =
      Array.from(
        modal.querySelectorAll(
          '[role="tab"]'
        )
      )
      .filter(APP.rendered);


    /* -----------------------------------------------------
       Google fallback.

       Find elements before "Select up to 6 things..."
       that look like tab controls.
       ----------------------------------------------------- */

    if (!tabs.length) {

      const instruction =
        Array.from(
          modal.querySelectorAll(
            "div,span,p"
          )
        )
        .find(element =>
          APP.normalize(
            element.textContent
          ).includes(
            "select up to 6 things"
          )
        );


      if (instruction) {

        const instructionY =
          instruction
            .getBoundingClientRect()
            .top;


        tabs =
          Array.from(
            modal.querySelectorAll(
              [
                "button",
                "a",
                '[role="button"]',
                "[tabindex]"
              ].join(",")
            )
          )
          .filter(element => {

            if (
              !APP.rendered(element)
            ) {
              return false;
            }


            const text =
              String(
                element.innerText ||
                element.textContent ||
                ""
              )
                .replace(/\s+/g, " ")
                .trim();


            if (
              !text ||
              text.length > 50
            ) {
              return false;
            }


            const rect =
              element.getBoundingClientRect();


            return (
              rect.top <
              instructionY
            );
          });
      }
    }


    /* -----------------------------------------------------
       Deduplicate
       ----------------------------------------------------- */

    tabs =
      Array.from(
        new Set(tabs)
      );


    /*
     * Sort left-to-right.
     */

    tabs.sort((a, b) => {

      const ar =
        a.getBoundingClientRect();


      const br =
        b.getBoundingClientRect();


      if (
        Math.abs(
          ar.top - br.top
        ) > 10
      ) {

        return ar.top - br.top;
      }


      return ar.left - br.left;
    });


    return tabs;
  };


  /* =========================================================
     TAB NAME
     ========================================================= */

  APP.getTabName = tab => {

    return String(
      tab.innerText ||
      tab.textContent ||
      "Unnamed tab"
    )
      .replace(/\s+/g, " ")
      .trim();
  };


  /* =========================================================
     CURRENT CATEGORY ID

     Helps us detect when Google actually changed tabs.
     ========================================================= */

  APP.getCurrentCategory = () => {

    const rows =
      APP.getRows();


    if (!rows.length) {
      return "";
    }


    return (
      rows[0].getAttribute(
        "service-category-id"
      ) || ""
    );
  };


  /* =========================================================
     ACTIVATE TAB
     ========================================================= */

  APP.activateTab =
    async tab => {

      APP.checkStop();


      const previousCategory =
        APP.getCurrentCategory();


      try {

        tab.scrollIntoView({
          block: "nearest",
          inline: "center",
          behavior: "auto"
        });

      } catch (_) {}


      /*
       * Click actual tab.
       */

      try {

        tab.click();

      } catch (_) {

        tab.dispatchEvent(
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


      /*
       * Don't just blindly wait.
       * Watch for actual tab/category update.
       */

      let elapsed = 0;


      while (
        elapsed <
        APP.settings.tabWait
      ) {

        APP.checkStop();


        const selected =
          tab.getAttribute(
            "aria-selected"
          ) === "true";


        const currentCategory =
          APP.getCurrentCategory();


        if (
          selected ||
          (
            previousCategory &&
            currentCategory &&
            currentCategory !==
              previousCategory
          )
        ) {

          break;
        }


        await APP.sleep(20);

        elapsed += 20;
      }


      /*
       * Small render stabilization.
       */

      await APP.sleep(60);
    };


  /* =========================================================
     GOOGLE BUSINESS HIGHLIGHT ROWS
     ========================================================= */

  APP.getRows = () => {

    const modal =
      APP.getModal();


    if (!modal) {
      return [];
    }


    return Array.from(
      modal.querySelectorAll(
        '[role="menuitemcheckbox"]'
      )
    )
    .filter(row => {

      if (
        !APP.rendered(row)
      ) {
        return false;
      }


      if (
        row.getAttribute(
          "aria-disabled"
        ) === "true"
      ) {
        return false;
      }


      if (
        row.getAttribute(
          "callout-disabled"
        ) === "true"
      ) {
        return false;
      }


      return true;
    });
  };


  /* =========================================================
     ROW LABEL
     ========================================================= */

  APP.getRowLabel = row => {

    if (!row) {
      return "";
    }


    /*
     * Prefer callout-id related label.
     */

    const calloutId =
      row.getAttribute(
        "callout-id"
      );


    if (calloutId) {

      try {

        const exact =
          row.querySelector(
            `#${CSS.escape(
              calloutId
            )}`
          );


        if (exact) {

          const text =
            String(
              exact.textContent ||
              ""
            )
              .replace(/\s+/g, " ")
              .trim();


          if (text) {
            return text;
          }
        }

      } catch (_) {}
    }


    return String(
      row.innerText ||
      row.textContent ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
  };


  /* =========================================================
     FIND ROW BY NAME
     ========================================================= */

  APP.findRow = name => {

    const wanted =
      APP.normalize(name);


    return (
      APP.getRows().find(
        row =>
          APP.normalize(
            APP.getRowLabel(row)
          ) === wanted
      ) ||
      null
    );
  };


  /* =========================================================
     READ GOOGLE CHECKED STATE
     ========================================================= */

  APP.getCheckedState = row => {

    if (!row) {
      return null;
    }


    const rowState =
      row.getAttribute(
        "aria-checked"
      );


    if (
      rowState === "true"
    ) {
      return true;
    }


    if (
      rowState === "false"
    ) {
      return false;
    }


    /*
     * Google's nested checkbox element.
     */

    const nested =
      row.querySelector(
        '[aria-checked]'
      );


    if (nested) {

      const state =
        nested.getAttribute(
          "aria-checked"
        );


      if (
        state === "true"
      ) {
        return true;
      }


      if (
        state === "false"
      ) {
        return false;
      }
    }


    return null;
  };


  /* =========================================================
     WAIT FOR STATE
     ========================================================= */

  APP.waitForState =
    async (
      name,
      expected
    ) => {

      let elapsed = 0;


      while (
        elapsed <
        APP.settings.stateTimeout
      ) {

        const fresh =
          APP.findRow(name);


        if (
          fresh &&
          APP.getCheckedState(
            fresh
          ) === expected
        ) {

          return true;
        }


        await APP.sleep(
          APP.settings.statePoll
        );


        elapsed +=
          APP.settings.statePoll;
      }


      return false;
    };


  /* =========================================================
     FIND BEST CLICK TARGETS
     ========================================================= */

  APP.getClickTargets = row => {

    const targets = [];


    /*
     * Google's nested visual checkbox.
     */

    row
      .querySelectorAll(
        [
          '[role="checkbox"]',
          '[role="presentation"][aria-checked]',
          '[aria-checked]'
        ].join(",")
      )
      .forEach(element =>
        targets.push(element)
      );


    /*
     * Label/text itself.
     */

    const label =
      APP.getRowLabel(row);


    if (label) {

      const wanted =
        APP.normalize(label);


      const descendants =
        Array.from(
          row.querySelectorAll(
            "span,div,label"
          )
        );


      const textElement =
        descendants.find(
          element =>
            APP.normalize(
              element.textContent
            ) === wanted
        );


      if (textElement) {
        targets.push(
          textElement
        );
      }
    }


    /*
     * Actual menuitemcheckbox row.
     */

    targets.push(row);


    return Array.from(
      new Set(targets)
    );
  };


  /* =========================================================
     MOUSE EVENT FALLBACK
     ========================================================= */

  APP.dispatchMouseClick =
    target => {

      const common = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        button: 0
      };


      target.dispatchEvent(
        new MouseEvent(
          "mousedown",
          {
            ...common,
            buttons: 1
          }
        )
      );


      target.dispatchEvent(
        new MouseEvent(
          "mouseup",
          {
            ...common,
            buttons: 0
          }
        )
      );


      target.dispatchEvent(
        new MouseEvent(
          "click",
          {
            ...common,
            buttons: 0
          }
        )
      );
    };


  /* =========================================================
     SET HIGHLIGHT STATE
     ========================================================= */

  APP.setHighlight =
    async (
      name,
      desired
    ) => {

      let row =
        APP.findRow(name);


      if (!row) {

        console.warn(
          `⚠ Not available: ${name}`
        );

        return false;
      }


      let state =
        APP.getCheckedState(
          row
        );


      if (
        state === desired
      ) {

        return true;
      }


      const targets =
        APP.getClickTargets(
          row
        );


      /*
       * Try the likely controls one at a time.
       * Stop immediately after Google changes state.
       */

      for (
        const target of targets
      ) {

        APP.checkStop();


        try {

          target.click();

        } catch (_) {}


        if (
          await APP.waitForState(
            name,
            desired
          )
        ) {

          return true;
        }


        /*
         * Fallback event sequence.
         */

        try {

          APP.dispatchMouseClick(
            target
          );

        } catch (_) {}


        if (
          await APP.waitForState(
            name,
            desired
          )
        ) {

          return true;
        }
      }


      return false;
    };


  /* =========================================================
     CONFIGURE CURRENT TAB
     ========================================================= */

  APP.configureCurrentTab =
    async tabName => {

      let rows =
        APP.getRows();


      console.log(
        `📋 ${tabName}: ${rows.length} highlight options detected.`
      );


      if (!rows.length) {

        console.error(
          `❌ No highlight options found for ${tabName}.`
        );


        return {
          status: "error"
        };
      }


      /* =====================================================
         STEP 1
         REMOVE WRONG CURRENT SELECTIONS
         ===================================================== */

      for (
        const row of rows
      ) {

        const name =
          APP.getRowLabel(row);


        if (!name) {
          continue;
        }


        const normalized =
          APP.normalize(name);


        const selected =
          APP.getCheckedState(
            row
          );


        if (
          selected === true &&
          !APP.requiredSet.has(
            normalized
          )
        ) {

          const success =
            await APP.setHighlight(
              name,
              false
            );


          if (success) {

            console.log(
              `⬜ Removed: ${name}`
            );

          } else {

            console.warn(
              `⚠ Could not remove: ${name}`
            );
          }
        }
      }


      /* =====================================================
         STEP 2
         CHECK THE SIX REQUIRED HIGHLIGHTS
         ===================================================== */

      const failures = [];


      for (
        const name of
        APP.required
      ) {

        APP.checkStop();


        const success =
          await APP.setHighlight(
            name,
            true
          );


        if (success) {

          console.log(
            `✅ ${name}`
          );

        } else {

          console.warn(
            `❌ Could not select: ${name}`
          );


          failures.push(
            name
          );
        }
      }


      /* =====================================================
         AUDIT
         ===================================================== */

      rows =
        APP.getRows();


      const selected =
        rows
          .filter(
            row =>
              APP.getCheckedState(
                row
              ) === true
          )
          .map(
            APP.getRowLabel
          );


      const correct =
        APP.required.filter(
          required => {

            const wanted =
              APP.normalize(
                required
              );


            return selected.some(
              current =>
                APP.normalize(
                  current
                ) === wanted
            );
          }
        );


      const wrong =
        selected.filter(
          name =>
            !APP.requiredSet.has(
              APP.normalize(name)
            )
        );


      const success =
        (
          correct.length === 6 &&
          wrong.length === 0
        );


      if (success) {

        console.log(
          `✅ ${tabName}: 6/6 correct.`
        );

      } else {

        console.warn(
          `⚠ ${tabName}: ${correct.length}/6 correct.`
        );


        if (
          wrong.length
        ) {

          console.warn(
            "Wrong selected:",
            wrong
          );
        }
      }


      return {
        status:
          success
            ? "processed"
            : "warning",

        correct:
          correct,

        wrong:
          wrong,

        failures:
          failures
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
        "LSA BUSINESS INFO - ALL TABS"
      );

      console.log(
        "============================================"
      );


      const modal =
        APP.getModal();


      if (!modal) {

        throw new Error(
          'Could not find the "Business info" modal.'
        );
      }


      /*
       * Discover every tab Google provided.
       */

      const tabs =
        APP.getTabs();


      if (!tabs.length) {

        throw new Error(
          "No Business Info tabs detected."
        );
      }


      const tabNames =
        tabs.map(
          APP.getTabName
        );


      console.log(
        `✅ Detected ${tabs.length} tab(s):`
      );


      tabNames.forEach(
        (name, index) => {

          console.log(
            `${index + 1}. ${name}`
          );
        }
      );


      const results = {};


      /* =====================================================
         JUMP THROUGH EVERY AVAILABLE TAB
         ===================================================== */

      for (
        let i = 0;
        i < tabs.length;
        i++
      ) {

        APP.checkStop();


        /*
         * Re-fetch tabs because Google may rebuild the DOM
         * after changing categories.
         */

        const freshTabs =
          APP.getTabs();


        const tab =
          freshTabs[i];


        if (!tab) {

          console.warn(
            `⚠ Tab ${i + 1} disappeared — skipping.`
          );

          continue;
        }


        const tabName =
          APP.getTabName(
            tab
          );


        console.log("");
        console.log(
          "============================================"
        );

        console.log(
          `▶ TAB ${i + 1}/${tabs.length}: ${tabName.toUpperCase()}`
        );

        console.log(
          "============================================"
        );


        await APP.activateTab(
          tab
        );


        results[tabName] =
          await APP.configureCurrentTab(
            tabName
          );


        await APP.sleep(
          APP.settings.betweenTabs
        );
      }


      /* =====================================================
         COMPLETE
         ===================================================== */

      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "🏁 BUSINESS INFO AUTOMATION COMPLETE"
      );

      console.log(
        "============================================"
      );


      Object.entries(
        results
      ).forEach(
        ([name, result]) => {

          console.log(
            `${name}: ${result.status}`
          );
        }
      );


      console.log("");
      console.log(
        `Processed ${Object.keys(results).length} / ${tabs.length} tabs.`
      );


      console.log(
        "🔒 SAVE was NOT clicked."
      );


      console.log(
        "Please review the tabs, then click SAVE manually."
      );


      return results;
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
          "🛑 Business Info automation stopped."
        );

      } else {

        console.error(
          "❌ BUSINESS INFO AUTOMATION ERROR:",
          error
        );
      }

    } finally {

      window[LOCK] = false;
    }

  })();

})();
