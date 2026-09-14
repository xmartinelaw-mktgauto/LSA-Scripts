(() => {
  "use strict";

  /* =========================================================
     NORTH CAROLINA LSA SERVICE AREA AUTOMATION
     =========================================================

     INCLUDED: 60 counties
     EXCLUDED: 40 counties
     TOTAL:    100 NC counties

     This script:
     - Runs automatically
     - Skips counties already entered
     - Retries failures
     - Pauses when the page becomes hidden
     - Resumes automatically
     - Does NOT click Next automatically

     ========================================================= */


  /* =========================================================
     PREVENT MULTIPLE SIMULTANEOUS RUNS
     ========================================================= */

  const RUN_LOCK = "__NC_LSA_AUTOMATION_RUNNING__";

  if (window[RUN_LOCK]) {
    console.warn(
      "⚠ NC LSA automation is already running."
    );

    return;
  }

  window[RUN_LOCK] = true;


  /* =========================================================
     GLOBAL OBJECT
     ========================================================= */

  window.LSA = window.LSA || {};

  const LSA = window.LSA;

  LSA.stopRequested = false;
  LSA.paused = false;
  LSA.lastResult = null;


  /* =========================================================
     APPROVED / INCLUDED COUNTIES
     ========================================================= */

  LSA.approvedCounties = [
    "Alamance County",
    "Alexander County",
    "Anson County",
    "Bertie County",
    "Burke County",
    "Cabarrus County",
    "Caldwell County",
    "Caswell County",
    "Catawba County",
    "Chatham County",
    "Cleveland County",
    "Cumberland County",
    "Davidson County",
    "Davie County",
    "Duplin County",
    "Durham County",
    "Edgecombe County",
    "Forsyth County",
    "Franklin County",
    "Gaston County",
    "Granville County",
    "Greene County",
    "Guilford County",
    "Halifax County",
    "Harnett County",
    "Hoke County",
    "Iredell County",
    "Johnston County",
    "Lee County",
    "Lenoir County",
    "Lincoln County",
    "Martin County",
    "McDowell County",
    "Mecklenburg County",
    "Montgomery County",
    "Moore County",
    "Nash County",
    "Northampton County",
    "Orange County",
    "Person County",
    "Pitt County",
    "Polk County",
    "Randolph County",
    "Richmond County",
    "Rockingham County",
    "Rowan County",
    "Rutherford County",
    "Sampson County",
    "Scotland County",
    "Stanly County",
    "Stokes County",
    "Surry County",
    "Union County",
    "Vance County",
    "Wake County",
    "Warren County",
    "Wayne County",
    "Wilkes County",
    "Wilson County",
    "Yadkin County"
  ];


  /* =========================================================
     EXCLUDED COUNTIES
     ========================================================= */

  LSA.excludedCounties = [
    "Alleghany County",
    "Ashe County",
    "Avery County",
    "Beaufort County",
    "Bladen County",
    "Brunswick County",
    "Buncombe County",
    "Camden County",
    "Carteret County",
    "Cherokee County",
    "Chowan County",
    "Clay County",
    "Columbus County",
    "Craven County",
    "Currituck County",
    "Dare County",
    "Gates County",
    "Graham County",
    "Haywood County",
    "Henderson County",
    "Hertford County",
    "Hyde County",
    "Jackson County",
    "Jones County",
    "Macon County",
    "Madison County",
    "Mitchell County",
    "New Hanover County",
    "Onslow County",
    "Pamlico County",
    "Pasquotank County",
    "Pender County",
    "Perquimans County",
    "Robeson County",
    "Swain County",
    "Transylvania County",
    "Tyrrell County",
    "Washington County",
    "Watauga County",
    "Yancey County"
  ];


  /* =========================================================
     SETTINGS
     ========================================================= */

  LSA.settings = {

    /* Maximum active-page wait for autocomplete */
    autocompleteTimeout: 10000,

    /* How frequently autocomplete is checked */
    autocompletePoll: 250,

    /* Wait after inputting county name */
    afterTypingDelay: 800,

    /* Wait after clicking a county */
    afterSelectionDelay: 1500,

    /* Wait between counties */
    betweenCountiesDelay: 1200,

    /* Wait between different search attempts */
    betweenAttemptsDelay: 1000,

    /* Wait before retrying failed counties */
    retryPassDelay: 6000,

    /* Number of complete passes */
    maxPasses: 3,

    /* Wait after returning from hidden/background state */
    resumeDelay: 1500
  };


  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  LSA.sleep = function(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  };


  LSA.normalize = function(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };


  LSA.documentY = function(element) {

    if (!element) {
      return Infinity;
    }

    return (
      element.getBoundingClientRect().top +
      window.scrollY
    );
  };


  LSA.isVisible = function(element) {

    if (!element) {
      return false;
    }

    const style =
      window.getComputedStyle(element);

    const rect =
      element.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      parseFloat(style.opacity || "1") !== 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  };


  /* =========================================================
     STOP CONTROL

     If needed, run:
     LSA.stop()
     ========================================================= */

  LSA.stop = function() {

    LSA.stopRequested = true;

    console.warn(
      "🛑 Stop requested. Automation will stop at the next safe point."
    );
  };


  LSA.checkStopped = function() {

    if (LSA.stopRequested) {
      throw new Error(
        "Automation stopped manually."
      );
    }
  };


  /* =========================================================
     BACKGROUND / VISIBILITY CONTROL
     ========================================================= */

  LSA.waitUntilVisible = async function() {

    LSA.checkStopped();


    if (!document.hidden) {
      return false;
    }


    if (!LSA.paused) {

      LSA.paused = true;

      console.warn("");
      console.warn(
        "============================================"
      );

      console.warn(
        "⏸ AUTOMATION PAUSED"
      );

      console.warn(
        "This LSA page is currently hidden."
      );

      console.warn(
        "The script will resume automatically when the page becomes visible again."
      );

      console.warn(
        "============================================"
      );
    }


    await new Promise(function(resolve) {

      const handleVisibility =
        function() {

          if (!document.hidden) {

            document.removeEventListener(
              "visibilitychange",
              handleVisibility
            );

            resolve();
          }
        };


      document.addEventListener(
        "visibilitychange",
        handleVisibility
      );


      /*
       * Handles the small possibility that visibility
       * changed between the initial check and listener.
       */

      if (!document.hidden) {

        document.removeEventListener(
          "visibilitychange",
          handleVisibility
        );

        resolve();
      }
    });


    LSA.paused = false;


    console.log("");
    console.log(
      "============================================"
    );

    console.log(
      "▶ PAGE VISIBLE — RESUMING AUTOMATION"
    );

    console.log(
      "============================================"
    );


    /*
     * Give Google's page/autocomplete time to wake up.
     */

    await LSA.sleep(
      LSA.settings.resumeDelay
    );


    return true;
  };


  document.addEventListener(
    "visibilitychange",
    function() {

      if (document.hidden) {

        console.warn(
          "⏸ Page became hidden. Script will pause at the next safe point."
        );

      } else {

        console.log(
          "👁 LSA page is visible."
        );

      }
    }
  );


  /* =========================================================
     VALIDATE COUNTY LISTS
     ========================================================= */

  LSA.validateLists = function() {

    const approved =
      new Set(
        LSA.approvedCounties.map(
          LSA.normalize
        )
      );


    const excluded =
      new Set(
        LSA.excludedCounties.map(
          LSA.normalize
        )
      );


    const overlap =
      Array.from(approved).filter(
        function(county) {

          return excluded.has(
            county
          );
        }
      );


    const total =
      new Set([
        ...approved,
        ...excluded
      ]).size;


    console.log(
      "Approved counties:",
      approved.size
    );

    console.log(
      "Excluded counties:",
      excluded.size
    );

    console.log(
      "Total NC counties:",
      total
    );


    if (overlap.length) {

      console.error(
        "❌ Counties appear in BOTH lists:",
        overlap
      );

      return false;
    }


    if (approved.size !== 60) {

      console.error(
        "❌ Expected 60 approved counties. Found:",
        approved.size
      );

      return false;
    }


    if (excluded.size !== 40) {

      console.error(
        "❌ Expected 40 excluded counties. Found:",
        excluded.size
      );

      return false;
    }


    if (total !== 100) {

      console.error(
        "❌ Expected 100 total NC counties. Found:",
        total
      );

      return false;
    }


    console.log(
      "✅ County lists validated."
    );


    return true;
  };


  /* =========================================================
     FIND SECTION HEADINGS
     ========================================================= */

  LSA.findHeading = function(searchText) {

    const target =
      LSA.normalize(
        searchText
      );


    const elements =
      Array.from(
        document.querySelectorAll(
          "h1,h2,h3,h4,h5,h6,label,strong,p,span,div"
        )
      );


    /*
     * Prefer an exact heading match.
     */

    let result =
      elements.find(
        function(element) {

          return (
            LSA.isVisible(element) &&
            LSA.normalize(
              element.textContent
            ) === target
          );
        }
      );


    if (result) {
      return result;
    }


    /*
     * Fall back to small elements containing
     * the desired heading.
     */

    result =
      elements.find(
        function(element) {

          if (
            !LSA.isVisible(element)
          ) {

            return false;
          }


          const text =
            LSA.normalize(
              element.textContent
            );


          return (
            text.includes(target) &&
            text.length <=
              target.length + 80
          );
        }
      );


    return result || null;
  };


  /* =========================================================
     FIND INCLUDE / EXCLUDE INPUT
     ========================================================= */

  LSA.getSectionInput = function(type) {

    const includeHeading =
      LSA.findHeading(
        "Include these service areas"
      );


    const excludeHeading =
      LSA.findHeading(
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
      LSA.documentY(
        includeHeading
      );


    const excludeY =
      LSA.documentY(
        excludeHeading
      );


    let inputs =
      Array.from(
        document.querySelectorAll(
          'input[type="text"], input[type="search"], input:not([type])'
        )
      )
      .filter(
        function(input) {

          return (
            LSA.isVisible(input) &&
            !input.disabled &&
            !input.readOnly
          );
        }
      )
      .map(
        function(input) {

          return {
            input: input,
            y: LSA.documentY(
              input
            )
          };
        }
      );


    if (type === "include") {

      inputs =
        inputs.filter(
          function(item) {

            return (
              item.y > includeY &&
              item.y < excludeY
            );
          }
        );


      inputs.sort(
        function(a, b) {

          return (
            Math.abs(
              a.y - includeY
            ) -
            Math.abs(
              b.y - includeY
            )
          );
        }
      );

    } else if (type === "exclude") {

      inputs =
        inputs.filter(
          function(item) {

            return (
              item.y > excludeY
            );
          }
        );


      inputs.sort(
        function(a, b) {

          return (
            Math.abs(
              a.y - excludeY
            ) -
            Math.abs(
              b.y - excludeY
            )
          );
        }
      );
    }


    if (!inputs.length) {

      console.error(
        "❌ Could not locate " +
        type +
        " service area input."
      );

      return null;
    }


    return inputs[0].input;
  };


  /* =========================================================
     SET REACT INPUT VALUE
     ========================================================= */

  LSA.setInputValue = function(
    input,
    value
  ) {

    if (!input) {
      return;
    }


    const previousValue =
      input.value;


    const descriptor =
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
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


    /*
     * React value tracker fix.
     */

    if (
      input._valueTracker
    ) {

      input._valueTracker.setValue(
        previousValue
      );
    }


    try {

      input.dispatchEvent(
        new InputEvent(
          "input",
          {
            bubbles: true,
            composed: true,
            inputType:
              "insertText",
            data: value
          }
        )
      );

    } catch (error) {

      input.dispatchEvent(
        new Event(
          "input",
          {
            bubbles: true
          }
        )
      );
    }


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

  LSA.clearInput =
    async function(input) {

      if (!input) {
        return;
      }


      await LSA.waitUntilVisible();


      input.focus();


      LSA.setInputValue(
        input,
        ""
      );


      input.dispatchEvent(
        new KeyboardEvent(
          "keydown",
          {
            key: "Backspace",
            code: "Backspace",
            bubbles: true
          }
        )
      );


      input.dispatchEvent(
        new KeyboardEvent(
          "keyup",
          {
            key: "Backspace",
            code: "Backspace",
            bubbles: true
          }
        )
      );


      await LSA.sleep(300);
    };


  /* =========================================================
     DETECT IF COUNTY IS ALREADY SELECTED
     ========================================================= */

  LSA.isCountySelected =
    function(
      county,
      type
    ) {

      const target =
        LSA.normalize(
          county
        );


      const includeHeading =
        LSA.findHeading(
          "Include these service areas"
        );


      const excludeHeading =
        LSA.findHeading(
          "Exclude these service areas"
        );


      if (
        !includeHeading ||
        !excludeHeading
      ) {

        return false;
      }


      const includeY =
        LSA.documentY(
          includeHeading
        );


      const excludeY =
        LSA.documentY(
          excludeHeading
        );


      const elements =
        Array.from(
          document.querySelectorAll(
            "div,span,button,li"
          )
        );


      return elements.some(
        function(element) {

          if (
            !LSA.isVisible(element)
          ) {

            return false;
          }


          /*
           * Ignore autocomplete dropdown results.
           */

          if (
            element.closest(
              '[role="listbox"], .pac-container, .goog-menu'
            )
          ) {

            return false;
          }


          if (
            element.getAttribute(
              "role"
            ) === "option"
          ) {

            return false;
          }


          const text =
            LSA.normalize(
              element.textContent
            );


          if (
            !text.includes(
              target
            )
          ) {

            return false;
          }


          /*
           * Avoid massive section/container elements.
           */

          if (
            text.length >
            target.length + 80
          ) {

            return false;
          }


          const y =
            LSA.documentY(
              element
            );


          if (
            type === "include"
          ) {

            return (
              y > includeY &&
              y < excludeY
            );
          }


          if (
            type === "exclude"
          ) {

            return (
              y > excludeY
            );
          }


          return false;
        }
      );
    };


  /* =========================================================
     GET AUTOCOMPLETE CANDIDATES
     ========================================================= */

  LSA.getAutocompleteCandidates =
    function() {

      const selectors = [
        '[role="option"]',
        '[role="listbox"] li',
        '[role="listbox"] > div',
        ".pac-item",
        ".goog-menuitem",
        "[data-value]"
      ];


      const candidates = [];


      selectors.forEach(
        function(selector) {

          document
            .querySelectorAll(
              selector
            )
            .forEach(
              function(element) {

                if (
                  LSA.isVisible(
                    element
                  )
                ) {

                  candidates.push(
                    element
                  );
                }
              }
            );
        }
      );


      /*
       * Google sometimes doesn't expose normal
       * autocomplete roles. Search small visible
       * elements as a fallback.
       */

      document
        .querySelectorAll(
          "li,div,span"
        )
        .forEach(
          function(element) {

            if (
              !LSA.isVisible(
                element
              )
            ) {

              return;
            }


            const text =
              LSA.normalize(
                element.textContent
              );


            const rect =
              element.getBoundingClientRect();


            if (
              text.includes(
                "county"
              ) &&
              (
                text.includes(
                  "north carolina"
                ) ||
                /\bnc\b/.test(
                  text
                )
              ) &&
              text.length < 180 &&
              rect.height < 150
            ) {

              candidates.push(
                element
              );
            }
          }
        );


      return Array.from(
        new Set(
          candidates
        )
      );
    };


  /* =========================================================
     FIND CORRECT NC AUTOCOMPLETE OPTION
     ========================================================= */

  LSA.findAutocompleteOption =
    function(county) {

      const target =
        LSA.normalize(
          county
        );


      const shortName =
        target.replace(
          /\s+county$/,
          ""
        );


      const candidates =
        LSA.getAutocompleteCandidates();


      const matching =
        candidates
          .map(
            function(element) {

              return {
                element: element,
                text:
                  LSA.normalize(
                    element.textContent
                  )
              };
            }
          )
          .filter(
            function(item) {

              const text =
                item.text;


              const countyMatch =
                (
                  text.includes(
                    target
                  ) ||
                  (
                    text.includes(
                      shortName
                    ) &&
                    text.includes(
                      "county"
                    )
                  )
                );


              const stateMatch =
                (
                  text.includes(
                    "north carolina"
                  ) ||
                  /\bnc\b/.test(
                    text
                  )
                );


              return (
                countyMatch &&
                stateMatch
              );
            }
          );


      /*
       * Prefer the smallest matching element.
       * This prevents clicking a large parent container.
       */

      matching.sort(
        function(a, b) {

          return (
            a.text.length -
            b.text.length
          );
        }
      );


      return matching.length
        ? matching[0].element
        : null;
    };


  /* =========================================================
     WAIT FOR AUTOCOMPLETE

     Hidden/background time does NOT count toward timeout.
     ========================================================= */

  LSA.waitForAutocomplete =
    async function(county) {

      let remaining =
        LSA.settings.autocompleteTimeout;


      while (
        remaining > 0
      ) {

        LSA.checkStopped();


        /*
         * This waits indefinitely if the tab is hidden.
         * Hidden time is not deducted from remaining timeout.
         */

        await LSA.waitUntilVisible();


        const option =
          LSA.findAutocompleteOption(
            county
          );


        if (option) {
          return option;
        }


        await LSA.sleep(
          LSA.settings.autocompletePoll
        );


        remaining -=
          LSA.settings.autocompletePoll;
      }


      return null;
    };


  /* =========================================================
     TYPE COUNTY INTO FIELD
     ========================================================= */

  LSA.typeCounty =
    async function(
      input,
      searchText
    ) {

      LSA.checkStopped();


      await LSA.waitUntilVisible();


      await LSA.clearInput(
        input
      );


      input.scrollIntoView({
        block: "center",
        behavior: "auto"
      });


      await LSA.sleep(300);


      await LSA.waitUntilVisible();


      input.focus();
      input.click();


      await LSA.sleep(200);


      LSA.setInputValue(
        input,
        searchText
      );


      /*
       * Additional keyboard activity helps some
       * versions of Google's autocomplete.
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


      await LSA.sleep(
        LSA.settings.afterTypingDelay
      );
    };


  /* =========================================================
     CLICK AUTOCOMPLETE OPTION
     ========================================================= */

  LSA.clickAutocompleteOption =
    async function(option) {

      LSA.checkStopped();


      await LSA.waitUntilVisible();


      if (!option) {
        return;
      }


      option.scrollIntoView({
        block: "nearest",
        behavior: "auto"
      });


      await LSA.sleep(150);


      const mouseOptions = {
        bubbles: true,
        cancelable: true,
        view: window
      };


      try {

        option.dispatchEvent(
          new MouseEvent(
            "mousedown",
            mouseOptions
          )
        );


        option.dispatchEvent(
          new MouseEvent(
            "mouseup",
            mouseOptions
          )
        );


        option.dispatchEvent(
          new MouseEvent(
            "click",
            mouseOptions
          )
        );

      } catch (error) {

        option.click();
      }


      await LSA.sleep(
        LSA.settings.afterSelectionDelay
      );
    };


  /* =========================================================
     ADD ONE COUNTY
     ========================================================= */

  LSA.addCounty =
    async function(
      county,
      type
    ) {

      LSA.checkStopped();


      await LSA.waitUntilVisible();


      /*
       * Skip counties already present.
       */

      if (
        LSA.isCountySelected(
          county,
          type
        )
      ) {

        console.log(
          "⏭ " +
          type.toUpperCase() +
          " already present: " +
          county
        );


        return "already";
      }


      /*
       * Different searches help when Google
       * autocomplete is inconsistent.
       */

      const searches = [
        county + ", NC",
        county + ", North Carolina",
        county + " North Carolina"
      ];


      for (
        let attempt = 0;
        attempt < searches.length;
        attempt++
      ) {

        LSA.checkStopped();


        await LSA.waitUntilVisible();


        /*
         * Re-find the input every attempt because Google's
         * interface often rebuilds DOM elements.
         */

        const input =
          LSA.getSectionInput(
            type
          );


        if (!input) {

          console.error(
            "❌ Cannot locate " +
            type.toUpperCase() +
            " input for " +
            county
          );


          return "error";
        }


        const searchText =
          searches[attempt];


        console.log(
          "🔎 " +
          type.toUpperCase() +
          " | " +
          county +
          " | Attempt " +
          (attempt + 1) +
          "/" +
          searches.length
        );


        console.log(
          "   Search:",
          searchText
        );


        await LSA.typeCounty(
          input,
          searchText
        );


        const option =
          await LSA.waitForAutocomplete(
            county
          );


        if (!option) {

          console.warn(
            "⚠ No matching North Carolina autocomplete result for:",
            county
          );


          await LSA.clearInput(
            input
          );


          await LSA.sleep(
            LSA.settings.betweenAttemptsDelay
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


        await LSA.waitUntilVisible();


        await LSA.clickAutocompleteOption(
          option
        );


        /*
         * Verify county actually appears in the
         * correct Include/Exclude section.
         */

        let verified = false;


        for (
          let verify = 0;
          verify < 10;
          verify++
        ) {

          await LSA.waitUntilVisible();


          if (
            LSA.isCountySelected(
              county,
              type
            )
          ) {

            verified = true;
            break;
          }


          await LSA.sleep(
            400
          );
        }


        if (verified) {

          console.log(
            "✅ " +
            type.toUpperCase() +
            ": " +
            county
          );


          return "added";
        }


        console.warn(
          "⚠ Autocomplete was clicked but county was not verified:",
          county
        );


        await LSA.sleep(
          LSA.settings.betweenAttemptsDelay
        );
      }


      console.error(
        "❌ FAILED " +
        type.toUpperCase() +
        ": " +
        county
      );


      return "failed";
    };


  /* =========================================================
     PROCESS COUNTY LIST WITH RETRY PASSES
     ========================================================= */

  LSA.processList =
    async function(
      counties,
      type
    ) {

      let remaining =
        counties.slice();


      const completed =
        new Set();


      const passes = [];


      for (
        let pass = 1;
        pass <=
          LSA.settings.maxPasses;
        pass++
      ) {

        LSA.checkStopped();


        await LSA.waitUntilVisible();


        if (
          remaining.length === 0
        ) {

          break;
        }


        console.log("");
        console.log(
          "============================================"
        );

        console.log(
          "🔄 " +
          type.toUpperCase() +
          " PASS " +
          pass +
          " OF " +
          LSA.settings.maxPasses
        );

        console.log(
          "Counties to process:",
          remaining.length
        );

        console.log(
          "============================================"
        );


        const failedThisPass = [];


        for (
          let i = 0;
          i < remaining.length;
          i++
        ) {

          LSA.checkStopped();


          await LSA.waitUntilVisible();


          const county =
            remaining[i];


          console.log("");
          console.log(
            "[" +
            (i + 1) +
            "/" +
            remaining.length +
            "] " +
            county
          );


          try {

            const status =
              await LSA.addCounty(
                county,
                type
              );


            if (
              status === "added" ||
              status === "already"
            ) {

              completed.add(
                county
              );

            } else {

              failedThisPass.push(
                county
              );
            }

          } catch (error) {

            if (
              LSA.stopRequested
            ) {

              throw error;
            }


            console.error(
              "❌ Unexpected error:",
              county,
              error
            );


            failedThisPass.push(
              county
            );
          }


          await LSA.waitUntilVisible();


          await LSA.sleep(
            LSA.settings.betweenCountiesDelay
          );
        }


        passes.push({
          pass: pass,
          failed:
            failedThisPass.slice()
        });


        remaining =
          failedThisPass;


        if (
          remaining.length > 0 &&
          pass <
            LSA.settings.maxPasses
        ) {

          console.warn("");
          console.warn(
            "⏳ " +
            remaining.length +
            " counties will be retried after cooldown:"
          );

          console.warn(
            remaining
          );


          await LSA.waitUntilVisible();


          await LSA.sleep(
            LSA.settings.retryPassDelay
          );
        }
      }


      return {
        completed:
          Array.from(
            completed
          ),

        failed:
          remaining,

        passes:
          passes
      };
    };


  /* =========================================================
     FINAL PAGE AUDIT
     ========================================================= */

  LSA.audit = function() {

    const includeMissing =
      LSA.approvedCounties.filter(
        function(county) {

          return !LSA.isCountySelected(
            county,
            "include"
          );
        }
      );


    const excludeMissing =
      LSA.excludedCounties.filter(
        function(county) {

          return !LSA.isCountySelected(
            county,
            "exclude"
          );
        }
      );


    console.log("");
    console.log(
      "============================================"
    );

    console.log(
      "📋 FINAL PAGE AUDIT"
    );

    console.log(
      "============================================"
    );


    console.log(
      "Included counties detected:",
      60 - includeMissing.length,
      "/ 60"
    );


    console.log(
      "Excluded counties detected:",
      40 - excludeMissing.length,
      "/ 40"
    );


    if (
      includeMissing.length === 0
    ) {

      console.log(
        "✅ All 60 included counties detected."
      );

    } else {

      console.warn(
        "⚠ Missing INCLUDED counties:",
        includeMissing
      );
    }


    if (
      excludeMissing.length === 0
    ) {

      console.log(
        "✅ All 40 excluded counties detected."
      );

    } else {

      console.warn(
        "⚠ Missing EXCLUDED counties:",
        excludeMissing
      );
    }


    return {
      includeMissing:
        includeMissing,

      excludeMissing:
        excludeMissing
    };
  };


  /* =========================================================
     MASTER AUTOMATION
     ========================================================= */

  LSA.run =
    async function() {

      LSA.stopRequested = false;


      console.clear();


      console.log(
        "============================================"
      );

      console.log(
        "🚀 NORTH CAROLINA LSA SERVICE AREA"
      );

      console.log(
        "   AUTOMATIC SETUP STARTED"
      );

      console.log(
        "============================================"
      );


      if (
        !LSA.validateLists()
      ) {

        throw new Error(
          "County validation failed."
        );
      }


      await LSA.waitUntilVisible();


      /*
       * Confirm both inputs exist before starting.
       */

      const includeInput =
        LSA.getSectionInput(
          "include"
        );


      const excludeInput =
        LSA.getSectionInput(
          "exclude"
        );


      if (!includeInput) {

        throw new Error(
          'Could not locate "Include these service areas" input.'
        );
      }


      if (!excludeInput) {

        throw new Error(
          'Could not locate "Exclude these service areas" input.'
        );
      }


      console.log(
        "✅ Include input detected."
      );

      console.log(
        "✅ Exclude input detected."
      );


      /* =====================================================
         STEP 1
         INCLUDED SERVICE AREAS
         ===================================================== */

      console.log("");
      console.log(
        "############################################"
      );

      console.log(
        "STEP 1 OF 2"
      );

      console.log(
        "ADDING / VERIFYING 60 INCLUDED COUNTIES"
      );

      console.log(
        "############################################"
      );


      const includeResult =
        await LSA.processList(
          LSA.approvedCounties,
          "include"
        );


      await LSA.waitUntilVisible();


      console.log("");
      console.log(
        "✅ Included county processing finished."
      );

      console.log(
        "⏳ Waiting before starting excluded counties..."
      );


      await LSA.sleep(
        5000
      );


      /* =====================================================
         STEP 2
         EXCLUDED SERVICE AREAS
         ===================================================== */

      await LSA.waitUntilVisible();


      console.log("");
      console.log(
        "############################################"
      );

      console.log(
        "STEP 2 OF 2"
      );

      console.log(
        "ADDING / VERIFYING 40 EXCLUDED COUNTIES"
      );

      console.log(
        "############################################"
      );


      const excludeResult =
        await LSA.processList(
          LSA.excludedCounties,
          "exclude"
        );


      /* =====================================================
         FINAL AUDIT
         ===================================================== */

      await LSA.waitUntilVisible();


      await LSA.sleep(
        2000
      );


      const audit =
        LSA.audit();


      const result = {
        include:
          includeResult,

        exclude:
          excludeResult,

        audit:
          audit
      };


      LSA.lastResult =
        result;


      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "🏁 AUTOMATION COMPLETE"
      );

      console.log(
        "============================================"
      );


      if (
        audit.includeMissing.length === 0 &&
        audit.excludeMissing.length === 0
      ) {

        console.log(
          "✅ SUCCESS"
        );

        console.log(
          "✅ 60 INCLUDED COUNTIES"
        );

        console.log(
          "✅ 40 EXCLUDED COUNTIES"
        );

        console.log(
          "✅ ALL 100 NORTH CAROLINA COUNTIES ACCOUNTED FOR"
        );

        console.log("");
        console.log(
          "Please visually review the page before clicking Next."
        );

      } else {

        console.warn(
          "⚠ Some counties could not be verified."
        );


        console.warn(
          "Missing INCLUDED:",
          audit.includeMissing
        );


        console.warn(
          "Missing EXCLUDED:",
          audit.excludeMissing
        );


        console.warn("");
        console.warn(
          "You can run LSA.run() again to retry."
        );
      }


      return result;
    };


  /* =========================================================
     AUTOMATIC START
     ========================================================= */

  (async function() {

    try {

      await LSA.run();

    } catch (error) {

      if (
        LSA.stopRequested
      ) {

        console.warn(
          "🛑 LSA automation stopped."
        );

      } else {

        console.error(
          "❌ LSA AUTOMATION ERROR:",
          error
        );
      }

    } finally {

      window[RUN_LOCK] = false;

    }

  })();

})();
