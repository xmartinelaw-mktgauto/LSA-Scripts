// ==UserScript==
// @name         Martine Law - LSA Master Automation
// @namespace    https://github.com/xmartinelaw-mktgauto/LSA-Scripts
// @version      1.0.28
// @description  Complete standalone Martine Law Google Local Services Ads signup automation across page navigation. Each Chrome tab keeps its own independent automation run using sessionStorage. Stage-aware cancellation immediately stops old page handlers after Google navigates to the next LSA step. Trusted Types safe UI. Includes mapped multi-state office selectors, Google address autocomplete selection, languages, service areas, service types, and business hours. On the Create an account screen it uses a hard manual gate: it may prepare Continue creating a new account, but all synthetic Next clicks are blocked so only a real user click can continue.
// @match        https://ads.google.com/localservices/*
// @grant        none
// @sandbox      raw
// @noframes
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  const STORAGE_KEY = "martine_lsa_master_tab_v1";
  const UI_ID = "martine-lsa-master-ui";
  const LOOP_MS = 1000;

  const MARKETS = {
    NC: {
      label: "North Carolina",
      state: "North Carolina",
      owner: { first: "Cynthia", last: "Smith" },
      include: [
        "Alamance County", "Alexander County", "Anson County", "Bertie County", "Burke County",
        "Cabarrus County", "Caldwell County", "Caswell County", "Catawba County", "Chatham County",
        "Cleveland County", "Cumberland County", "Davidson County", "Davie County", "Duplin County",
        "Durham County", "Edgecombe County", "Forsyth County", "Franklin County", "Gaston County",
        "Granville County", "Greene County", "Guilford County", "Halifax County", "Harnett County",
        "Hoke County", "Iredell County", "Johnston County", "Lee County", "Lenoir County",
        "Lincoln County", "Martin County", "McDowell County", "Mecklenburg County", "Montgomery County",
        "Moore County", "Nash County", "Northampton County", "Orange County", "Person County",
        "Pitt County", "Polk County", "Randolph County", "Richmond County", "Rockingham County",
        "Rowan County", "Rutherford County", "Sampson County", "Scotland County", "Stanly County",
        "Stokes County", "Surry County", "Union County", "Vance County", "Wake County",
        "Warren County", "Wayne County", "Wilkes County", "Wilson County", "Yadkin County"
      ],
      exclude: [
        "Alleghany County", "Ashe County", "Avery County", "Beaufort County", "Bladen County",
        "Brunswick County", "Buncombe County", "Camden County", "Carteret County", "Cherokee County",
        "Chowan County", "Clay County", "Columbus County", "Craven County", "Currituck County",
        "Dare County", "Gates County", "Graham County", "Haywood County", "Henderson County",
        "Hertford County", "Hyde County", "Jackson County", "Jones County", "Macon County",
        "Madison County", "Mitchell County", "New Hanover County", "Onslow County", "Pamlico County",
        "Pasquotank County", "Pender County", "Perquimans County", "Robeson County", "Swain County",
        "Transylvania County", "Tyrrell County", "Washington County", "Watauga County", "Yancey County"
      ]
    },

    MN: {
      label: "Minnesota",
      state: "Minnesota",
      owner: { first: "Xavier", last: "Martine" },
      include: [
        "Hennepin County, MN", "Ramsey County, MN", "Anoka County, MN", "Washington County, MN",
        "Dakota County, MN", "Wright County, MN", "Carver County, MN", "Scott County, MN",
        "Minneapolis, MN", "St. Paul, MN", "Duluth, MN", "Hutchinson, MN", "Rochester, MN"
      ],
      exclude: []
    },

    NJ: {
      label: "New Jersey",
      state: "New Jersey",
      owner: { first: "Gillian", last: "Feehan" },
      include: [
        "Essex County, NJ", "Union County, NJ", "Passaic County, NJ", "Bergen County, NJ",
        "Morris County, NJ", "Somerset County, NJ", "Middlesex County, NJ", "Monmouth County, NJ",
        "Mercer County, NJ", "Hunterdon County, NJ", "Ocean County, NJ", "Warren County, NJ",
        "Hudson County, NJ", "Sussex County, NJ"
      ],
      exclude: []
    },

    TX_DALLAS: {
      label: "Texas - Dallas",
      state: "Texas",
      owner: { first: "Arleth", last: "Pulido-Nava" },
      include: [
        "Dallas County, TX", "Tarrant County, TX", "Collin County, TX", "Denton County, TX",
        "Rockwall County, TX", "Kaufman County, TX", "Ellis County, TX", "Johnson County, TX",
        "Parker County, TX", "Wise County, TX", "Hunt County, TX", "Navarro County, TX"
      ],
      exclude: ["Waco, TX", "Tyler, TX"]
    },

    TX_SAN_ANTONIO: {
      label: "Texas - San Antonio",
      state: "Texas",
      owner: { first: "Arleth", last: "Pulido-Nava" },
      include: [
        "Bexar County, TX", "Comal County, TX", "Guadalupe County, TX", "Wilson County, TX",
        "Kendall County, TX", "Atascosa County, TX", "Medina County, TX", "Bandera County, TX",
        "Hays County, TX", "Karnes County, TX", "Gonzales County, TX", "Frio County, TX"
      ],
      exclude: []
    },

    TX_AUSTIN: {
      label: "Texas - Austin",
      state: "Texas",
      owner: { first: "Arleth", last: "Pulido-Nava" },
      include: [
        "Travis County, TX", "Williamson County, TX", "Hays County, TX", "Bastrop County, TX",
        "Caldwell County, TX", "Burnet County, TX", "Blanco County, TX", "Lee County, TX",
        "Fayette County, TX", "Bell County, TX", "Milam County, TX"
      ],
      exclude: []
    }
  };

  const OFFICE_LOCATIONS = {
    NC: [
      { address: "10130 Perimeter Pkwy, Suite 200", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28216", phone: "(980) 300-7624", lsaNumber: "5266926199" },
      { address: "2015 Ayrsley Town Blvd, Suite 202", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28273", phone: "(980) 440-3822", lsaNumber: "7124637572*" },
      { address: "3117 Whiting Ave", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28205", phone: "(980) 400-7075", lsaNumber: "pending" },
      { address: "1101 Tyvola Rd", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28217", phone: "(980) 553-2236", lsaNumber: "4076723341*" },
      { address: "2303 W Morehead St", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28208", phone: "(980) 427-9954", lsaNumber: "4138935303*" },
      { address: "101 N Tryon St, Suite 600", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28202", phone: "(980) 340-7572", lsaNumber: "8415670072" },
      { address: "301 McCullough Dr, Suite 400", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28262", phone: "(704) 859-2197", lsaNumber: "3279475119" },
      { address: "6640 Wilkinson Blvd, Suite 400", city: "Belmont", state: "North Carolina", stateCode: "NC", zip: "28012", phone: "(704) 486-9447", lsaNumber: "4519556113" },
      { address: "315 Hubert St, Suite #13", city: "Raleigh", state: "North Carolina", stateCode: "NC", zip: "27603", phone: "(704) 397-3713", lsaNumber: "1516981601" },
      { address: "5306 Six Forks Rd", city: "Raleigh", state: "North Carolina", stateCode: "NC", zip: "27609", phone: "(980) 400-2962", lsaNumber: "2417099341*" },
      { address: "3301 Benson Dr ste 302", city: "Raleigh", state: "North Carolina", stateCode: "NC", zip: "27609", phone: "(704) 480-3450", lsaNumber: "5594508342" },
      { address: "156 S South St", city: "Gastonia", state: "North Carolina", stateCode: "NC", zip: "28052", phone: "(980) 981-6804", lsaNumber: "3254812192*" },
      { address: "7308 E Independence Blvd, Suite C", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28227", phone: "(980) 998-1659", lsaNumber: "9487202648*" },
      { address: "106 Langtree Village Dr, Suite 340", city: "Mooresville", state: "North Carolina", stateCode: "NC", zip: "28117", phone: "(704) 870-4791", lsaNumber: "1316002274" },
      { address: "600 Park Office Dr, Suite 371", city: "Durham", state: "North Carolina", stateCode: "NC", zip: "27709", phone: "(704) 946-5737", lsaNumber: "2440458141*" },
      { address: "2500 Regency Pkwy", city: "Cary", state: "North Carolina", stateCode: "NC", zip: "27518", phone: "(919) 629-1438", lsaNumber: "pending" },
      { address: "223 S West St, suite 900", city: "Raleigh", state: "North Carolina", stateCode: "NC", zip: "27603", phone: "(919) 925-4458", lsaNumber: "pending" },
      { address: "421 Fayetteville St #1100", city: "Raleigh", state: "North Carolina", stateCode: "NC", zip: "27601", phone: "(704) 286-9792", lsaNumber: "9148064988*" },
      { address: "1235 East Blvd ste e", city: "Charlotte", state: "North Carolina", stateCode: "NC", zip: "28203", phone: "(980) 998-1943", lsaNumber: "4494757009*" },
      { address: "224 Turnersburg Hwy Suite 1013", city: "Statesville", state: "North Carolina", stateCode: "NC", zip: "28625", phone: "(704) 741-9292", lsaNumber: "4577976758*" },
      { address: "15000 Weston Pkwy suite 114", city: "Cary", state: "North Carolina", stateCode: "NC", zip: "27513", phone: "(980) 409-5703", lsaNumber: "5211017327*" },
      { address: "50101 Governors Dr", city: "Chapel Hill", state: "North Carolina", stateCode: "NC", zip: "27517", phone: "(704) 233-3630", lsaNumber: "6281875619*" },
      { address: "1985 Tate Blvd SE, 5th Floor", city: "Hickory", state: "North Carolina", stateCode: "NC", zip: "28602", phone: "(704) 389-2580", lsaNumber: "1464422400*" },
      { address: "517 S Greensboro St", city: "Carrboro", state: "North Carolina", stateCode: "NC", zip: "27510", phone: "", lsaNumber: "pending" },
      { address: "19109 W Catawba Ave, Suite 200", city: "Cornelius", state: "North Carolina", stateCode: "NC", zip: "28031", phone: "(704) 445-2421", lsaNumber: "6610765666*" },
      { address: "280 Towerview Ct, 1st Floor", city: "Cary", state: "North Carolina", stateCode: "NC", zip: "27513", phone: "(704) 538-4236", lsaNumber: "7941699162*" },
      { address: "500 S Main St, 2nd Floor", city: "Mooresville", state: "North Carolina", stateCode: "NC", zip: "28115", phone: "(704) 272-2339", lsaNumber: "5329696121*" }
    ],

    MN: [
      { address: "5201 Eden Ave, Suite 300", city: "Edina", state: "Minnesota", stateCode: "MN", zip: "55436", phone: "(612) 688-4106", lsaNumber: "3939781196" },
      { address: "6385 Old Shady Oak Rd, Suite 250", city: "Eden Prairie", state: "Minnesota", stateCode: "MN", zip: "55344", phone: "(612) 979-2463", lsaNumber: "6022945678" },
      { address: "1650 West End Blvd, Suite 100", city: "St Louis Park", cityAliases: ["Saint Louis Park"], state: "Minnesota", stateCode: "MN", zip: "55416", phone: "(612) 353-8075", lsaNumber: "5171488958" },
      { address: "8530 Eagle Point Blvd, Suite 100", city: "Lake Elmo", state: "Minnesota", stateCode: "MN", zip: "55042", phone: "(612) 445-2208", lsaNumber: "6603647380" },
      { address: "124 4th Ave NE, Suite 1027", city: "Hutchinson", state: "Minnesota", stateCode: "MN", zip: "55350", phone: "(612) 421-7526", lsaNumber: "5732795288" },
      { address: "1626 London Rd, Suite 3010", city: "Duluth", state: "Minnesota", stateCode: "MN", zip: "55812", phone: "(612) 429-4801", lsaNumber: "7652643911*" },
      { address: "119 Paul Bunyan Dr NW, Suite A #1010", city: "Bemidji", state: "Minnesota", stateCode: "MN", zip: "56601", phone: "(612) 482-3541", lsaNumber: "7032966092" },
      { address: "310 S 4th Ave, Suite 1050", city: "Minneapolis", state: "Minnesota", stateCode: "MN", zip: "55415", phone: "(612) 351-6582", lsaNumber: "1871525664" },
      { address: "6160 Summit Dr N, Suite 200", city: "Brooklyn Center", state: "Minnesota", stateCode: "MN", zip: "55430", phone: "(612) 284-3628", lsaNumber: "1718404460*" },
      { address: "3450 Lexington Ave N, Suite 112", city: "Shoreview", state: "Minnesota", stateCode: "MN", zip: "55126", phone: "(612) 814-0376", lsaNumber: "4255695270*" },
      { address: "11670 Fountains Dr, Suite 200", city: "Maple Grove", state: "Minnesota", stateCode: "MN", zip: "55369", phone: "(612) 482-2308", lsaNumber: "2687797599*" },
      { address: "255 E Kellogg Blvd, Suite 101D", city: "St Paul", cityAliases: ["Saint Paul"], state: "Minnesota", stateCode: "MN", zip: "55101", phone: "(612) 421-8845", lsaNumber: "5458146839" },
      { address: "2355 MN-36, Suite 400", city: "Roseville", state: "Minnesota", stateCode: "MN", zip: "55113", phone: "(612) 682-1897", lsaNumber: "2714274370*" },
      { address: "925 Payne Ave, Suite B2", city: "St Paul", cityAliases: ["Saint Paul"], state: "Minnesota", stateCode: "MN", zip: "55130", phone: "(612) 682-6189", lsaNumber: "6273581829*" },
      { address: "11500 Wayzata Blvd, Suite 1156", city: "Minnetonka", cityAliases: ["Hopkins"], state: "Minnesota", stateCode: "MN", zip: "55305", phone: "(612) 662-7381", lsaNumber: "5672660084" },
      { address: "902 Hwy 15 South (MN-15), Suite 400", city: "Hutchinson", state: "Minnesota", stateCode: "MN", zip: "55350", phone: "(612) 999-2773", lsaNumber: "6985528809" },
      { address: "4525 White Bear Pkwy, Suite 205", city: "White Bear Lake", state: "Minnesota", stateCode: "MN", zip: "55110", phone: "(612) 416-6750", lsaNumber: "8418389905" },
      { address: "8030 Old Cedar Ave S, Suite 227 C", city: "Bloomington", state: "Minnesota", stateCode: "MN", zip: "55425", phone: "(612) 431-9867", lsaNumber: "3087952797" },
      { address: "330 S Second Ave, Suite 200", city: "Minneapolis", state: "Minnesota", stateCode: "MN", zip: "55401", phone: "(612) 439-4430", lsaNumber: "8629967698*" },
      { address: "860 Blue Gentian Rd, Suite 200", city: "Eagan", state: "Minnesota", stateCode: "MN", zip: "55121", phone: "(612) 712-4811", lsaNumber: "5557304482*" },
      { address: "7300 147th St W, Suite 406C", city: "Apple Valley", state: "Minnesota", stateCode: "MN", zip: "55124", phone: "(612) 509-8400", lsaNumber: "6974208774" },
      { address: "1907 Wayzata Blvd, 3rd Floor", city: "Wayzata", state: "Minnesota", stateCode: "MN", zip: "55391", phone: "(612) 441-3453", lsaNumber: "8580008244" },
      { address: "8400 Normandale Lake Blvd, Suite 920", city: "Minneapolis", cityAliases: ["Bloomington"], state: "Minnesota", stateCode: "MN", zip: "55437", phone: "(612) 260-6741", lsaNumber: "9253695966" },
      { address: "7900 International Dr, suite 300", city: "Bloomington", state: "Minnesota", stateCode: "MN", zip: "55425", phone: "(612) 503-5841", lsaNumber: "2349657649*" }
    ],

    NJ: [
      { address: "61 W Palisade Ave, 2B", city: "Englewood", state: "New Jersey", stateCode: "NJ", zip: "07631", phone: "(973) 847-2038", lsaNumber: "7922590339" },
      { address: "3 Gateway Ctr, 12th Fl, Suite 1230", city: "Newark", state: "New Jersey", stateCode: "NJ", zip: "07102", phone: "(973) 576-5012", lsaNumber: "5193372448*" },
      { address: "576 Central Ave, 3rd Floor", city: "East Orange", state: "New Jersey", stateCode: "NJ", zip: "07018", phone: "(973) 521-8297", lsaNumber: "8608755633*" },
      { address: "250 Pehle Ave, Suite 200", city: "Saddle Brook", state: "New Jersey", stateCode: "NJ", zip: "07663", phone: "(973) 528-8936", lsaNumber: "8410481011*" },
      { address: "411 NJ-17, Suite 500", city: "Hasbrouck Heights", state: "New Jersey", stateCode: "NJ", zip: "07604", phone: "(973) 380-0252", lsaNumber: "9019478093" },
      { address: "140 E Ridgewood Ave, Suite 415", city: "Paramus", state: "New Jersey", stateCode: "NJ", zip: "07652", phone: "(973) 240-5345", lsaNumber: "5949585782" },
      { address: "101 Hudson St, 21st Floor", city: "Jersey City", state: "New Jersey", stateCode: "NJ", zip: "07302", phone: "(973) 321-3864", lsaNumber: "9599831786*" },
      { address: "33 Wood Avenue South, Suite 600", city: "Iselin", cityAliases: ["Woodbridge"], state: "New Jersey", stateCode: "NJ", zip: "08830", phone: "(973) 273-4129", lsaNumber: "1251434574" },
      { address: "317 George St, Suite 320", city: "New Brunswick", state: "New Jersey", stateCode: "NJ", zip: "08901", phone: "(973) 381-2208", lsaNumber: "7909150991" },
      { address: "1100 Cornwall Rd, Suite 200", city: "South Brunswick", cityAliases: ["Monmouth Junction"], state: "New Jersey", stateCode: "NJ", zip: "08852", phone: "(973) 828-8071", lsaNumber: "6034639248" },
      { address: "350 Springfield Ave 200", city: "Summit", state: "New Jersey", stateCode: "NJ", zip: "07901", phone: "(908) 520-2259", lsaNumber: "5905473582" },
      { address: "1000 Wyckoff Ave, 3rd Floor", city: "Mahwah", state: "New Jersey", stateCode: "NJ", zip: "07430", phone: "", lsaNumber: "" },
      { address: "1 Tower Center Blvd, Suite 1510", city: "East Brunswick", state: "New Jersey", stateCode: "NJ", zip: "08816", phone: "", lsaNumber: "" },
      { address: "51 John F Kennedy Pkwy", city: "Short Hills", state: "New Jersey", stateCode: "NJ", zip: "07078", phone: "", lsaNumber: "" },
      { address: "233 Mt Airy Rd, First floor", city: "Basking Ridge", state: "New Jersey", stateCode: "NJ", zip: "07920", phone: "", lsaNumber: "" },
      { address: "50 Division Street, Suite 501", city: "Somerville", state: "New Jersey", stateCode: "NJ", zip: "08876", phone: "", lsaNumber: "" },
      { address: "100 Horizon Center Boulevard Suite 215", city: "Hamilton", cityAliases: ["Hamilton Township"], state: "New Jersey", stateCode: "NJ", zip: "08691", phone: "", lsaNumber: "" },
      { address: "100 Walnut Ave Suite 210", city: "Clark", state: "New Jersey", stateCode: "NJ", zip: "07066", phone: "", lsaNumber: "" },
      { address: "20 Commerce Dr Suite 135", city: "Cranford", state: "New Jersey", stateCode: "NJ", zip: "07016", phone: "", lsaNumber: "" },
      { address: "100 Matawan Road Suite 325", city: "Matawan", state: "New Jersey", stateCode: "NJ", zip: "07747", phone: "", lsaNumber: "" },
      { address: "4400 Route 9 South Suite 1000", city: "Freehold", state: "New Jersey", stateCode: "NJ", zip: "07728", phone: "", lsaNumber: "" }
    ],

    TX_DALLAS: [
      { address: "9800 Hillwood Pkwy, Suite 140", city: "Fort Worth", state: "Texas", stateCode: "TX", zip: "76177", phone: "(346) 423-4599", lsaNumber: "7497814774" },
      { address: "5050 Quorum Dr, No 6", city: "Dallas", state: "Texas", stateCode: "TX", zip: "75254", phone: "(346) 680-1751", lsaNumber: "9796766362" },
      { address: "4320 N Belt Line Rd", city: "Irving", state: "Texas", stateCode: "TX", zip: "75038", phone: "(346) 597-9968", lsaNumber: "5184587841" },
      { address: "325 North St. Paul St, Office 3129", city: "Dallas", state: "Texas", stateCode: "TX", zip: "75201", phone: "(346) 560-7829", lsaNumber: "5578426707" },
      { address: "550 Reserve St, Suite 250", city: "Southlake", state: "Texas", stateCode: "TX", zip: "76092", phone: "(346) 248-4104", lsaNumber: "8178143207" },
      { address: "5601 Bridge St, Suite 300", city: "Fort Worth", state: "Texas", stateCode: "TX", zip: "76112", phone: "(346) 641-4514", lsaNumber: "3937762111" },
      { address: "2000 E Lamar Blvd, Suite 600", city: "Arlington", state: "Texas", stateCode: "TX", zip: "76006", phone: "(346) 248-7561", lsaNumber: "6984037443" },
      { address: "3921 Long Prairie Rd, Building 5", city: "Flower Mound", state: "Texas", stateCode: "TX", zip: "75028", phone: "(346) 483-3967", lsaNumber: "1884465688" },
      { address: "825 Watters Creek Blvd, Building M, Suite 250", city: "Allen", state: "Texas", stateCode: "TX", zip: "75013", phone: "(214) 225-1660", lsaNumber: "6029052997" },
      { address: "4500 Mercantile Plaza Dr, Suite 300", city: "Fort Worth", state: "Texas", stateCode: "TX", zip: "76137", phone: "(817) 859-7628", lsaNumber: "5545835976" },
      { address: "97 Village Ln, 2nd Floor", city: "Colleyville", state: "Texas", stateCode: "TX", zip: "76034", phone: "(817) 842-2928", lsaNumber: "1410530717" },
      { address: "404 Airport Fwy, 1st Floor", city: "Bedford", state: "Texas", stateCode: "TX", zip: "76022", phone: "(817) 952-6479", lsaNumber: "2226587976" },
      { address: "295 E Renfro St, Suite 300", city: "Burleson", state: "Texas", stateCode: "TX", zip: "76028", phone: "(817) 635-2652", lsaNumber: "7287908037" },
      { address: "6800 Weiskopf Ave, Suite 150", city: "McKinney", state: "Texas", stateCode: "TX", zip: "75070", phone: "(346) 695-0903", lsaNumber: "1632224666" },
      { address: "6136 Frisco Square Blvd, Suite 400", city: "Frisco", state: "Texas", stateCode: "TX", zip: "75034", phone: "(346) 553-5906", lsaNumber: "5977760093" },
      { address: "101 E Park Blvd, Suite 600", city: "Plano", state: "Texas", stateCode: "TX", zip: "75074", phone: "", lsaNumber: "1266343544" },
      { address: "13509 Lyndon B Johnson Fwy, Suite 200", city: "Garland", state: "Texas", stateCode: "TX", zip: "75041", phone: "(817) 612-7850", lsaNumber: "1735188754" },
      { address: "901 W Rosedale St, Suite 250", city: "Fort Worth", state: "Texas", stateCode: "TX", zip: "76104", phone: "(346) 275-0789", lsaNumber: "5873913666" },
      { address: "3901 Arlington Highlands Blvd", city: "Arlington", state: "Texas", stateCode: "TX", zip: "76018", phone: "(346) 275-0549", lsaNumber: "3108007325" },
      { address: "7460 Warren Pkwy, Suite 100", city: "Frisco", state: "Texas", stateCode: "TX", zip: "75034", phone: "(214) 833-9493", lsaNumber: "8110815005" },
      { address: "3008 Ross Ave, Suite 100", city: "Dallas", state: "Texas", stateCode: "TX", zip: "75204", phone: "(346) 482-0583", lsaNumber: "1715271356" },
      { address: "2550 Pacific Ave, Suite 700", city: "Dallas", state: "Texas", stateCode: "TX", zip: "75226", phone: "(346) 248-4416", lsaNumber: "7514823199" }
    ],

    TX_SAN_ANTONIO: [],
    TX_AUSTIN: []
  };

  const SERVICE_TYPES = {
    "Criminal Lawyer": {
      mode: "exact",
      wanted: [
        "Domestic violence", "Drug possession", "DUIs & reckless driving", "Felonies",
        "Petty crimes & misdemeanors", "Restraining orders", "Sex offenses"
      ]
    },
    "DUI Lawyer": {
      mode: "all-except",
      exclude: ["Other"]
    },
    "Traffic Lawyer": {
      mode: "exact",
      wanted: ["DUI", "Reckless driving"]
    },
    "Family Lawyer": {
      mode: "exact",
      optional: true,
      wanted: [
        "Contested divorce", "Debt division", "Modification of orders", "Parent timesharing",
        "Paternity", "Prenups & marital agreements", "Property division", "Restraining orders",
        "Spousal support & alimony", "Uncontested divorce"
      ]
    }
  };

  const KNOWN_SERVICE_LABELS = [
    // Criminal
    "Corporate representation", "Criminal immigration defense", "Domestic violence", "Drug possession",
    "DUIs & reckless driving", "Expungement", "Federal crimes", "Felonies",
    "Petty crimes & misdemeanors", "Restraining orders", "Sex offenses", "Three-strikes law",
    // DUI
    "DUI with accident", "DUI with injury", "DUI/DWI", "Felony DUI", "Invalid tests",
    "Multiple offenses", "Reckless driving", "Underage DUI",
    // Traffic
    "Case assessment", "DUI", "Parking ticket", "Red light ticket", "Suspended license",
    "CDL traffic ticket", "Fix-it ticket", "Speeding ticket", "Traffic ticket",
    // Family
    "Adoption", "Child support", "Contested divorce", "Debt division", "Guardianship", "Mediation",
    "Modification of orders", "Parent timesharing", "Paternity", "Prenups & marital agreements",
    "Probate", "Property division", "Spousal support & alimony", "Uncontested divorce",
    // Common
    "Other"
  ];

  let stepRunning = false;
  let statusText = "Idle";
  let retryAfter = 0;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const norm = text => String(text || "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  const visible = el => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
  };

  const state = () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { active: false };
    } catch (_) {
      return { active: false };
    }
  };
  const saveState = data => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  };
  const patchState = patch => saveState({ ...state(), ...patch });

  const setStatus = text => {
    statusText = text;
    const el = document.querySelector(`#${UI_ID} [data-role="status"]`);
    if (el) el.textContent = text;
    console.log(`[LSA MASTER] ${text}`);
  };

  const waitUntilVisible = async () => {
    if (!document.hidden) return;
    setStatus("Paused while tab is hidden");
    await new Promise(resolve => {
      const fn = () => {
        if (!document.hidden) {
          document.removeEventListener("visibilitychange", fn);
          resolve();
        }
      };
      document.addEventListener("visibilitychange", fn);
    });
    await sleep(300);
  };

  const exactText = (text, root = document) => {
    const wanted = norm(text);
    const matches = Array.from(root.querySelectorAll("span,div,label,p,a,button,li"))
      .filter(el => visible(el) && norm(el.textContent) === wanted);
    matches.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return ar.width * ar.height - br.width * br.height;
    });
    return matches[0] || null;
  };

  const pageText = () => norm(document.body?.innerText || document.body?.textContent || "");

  const nativeSet = (input, value) => {
    if (!input) return false;
    const old = input.value;
    const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    input.focus();
    if (setter) setter.call(input, value);
    else input.value = value;
    if (input._valueTracker) input._valueTracker.setValue(old);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  const findInputByLabel = labelText => {
    const label = exactText(labelText);
    if (!label) return null;
    if (label.tagName === "LABEL") {
      const f = label.getAttribute("for");
      if (f) {
        const input = document.getElementById(f);
        if (input) return input;
      }
    }
    let node = label;
    for (let i = 0; i < 7 && node; i++, node = node.parentElement) {
      const inputs = Array.from(node.querySelectorAll?.("input,textarea") || []).filter(visible);
      if (inputs.length === 1) return inputs[0];
    }
    return null;
  };

  const buttonByText = text => {
    const wanted = norm(text);
    const els = Array.from(document.querySelectorAll("button,[role=button],a"))
      .filter(el => visible(el) && norm(el.textContent) === wanted);
    return els[0] || exactText(text);
  };

  const clickEl = async el => {
    if (!el) return false;
    try { el.scrollIntoView({ block: "center", behavior: "auto" }); } catch (_) {}
    await sleep(30);
    try { el.click(); } catch (_) {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true, view: window }));
    }
    await sleep(100);
    return true;
  };

  // Google Local Services uses several generations of custom dropdown controls.
  // These helpers target the visible field/row instead of relying on one CSS class.
  const allExactText = (text, root = document) => {
    const wanted = norm(text);
    return Array.from(root.querySelectorAll("span,div,label,p,a,button,li"))
      .filter(el => visible(el) && norm(el.textContent) === wanted);
  };

  const visualFieldAncestor = textEl => {
    if (!textEl) return null;
    let node = textEl;
    let best = null;
    for (let i = 0; i < 9 && node; i++, node = node.parentElement) {
      const r = node.getBoundingClientRect();
      if (r.width >= 140 && r.width <= 800 && r.height >= 28 && r.height <= 82) {
        best = node;
        if (node.matches?.('select,[role="combobox"],[role="button"],[aria-haspopup],[aria-expanded],[tabindex]') || node.hasAttribute?.("jsaction")) {
          return node;
        }
      }
    }
    return best;
  };

  const fullGoogleClick = async el => {
    if (!el) return false;
    try { el.scrollIntoView({ block: "center", behavior: "auto" }); } catch (_) {}
    await sleep(25);
    const r = el.getBoundingClientRect();
    const x = Math.max(r.left + 4, Math.min(r.right - 4, r.left + r.width * 0.35));
    const y = r.top + r.height / 2;
    let target = document.elementFromPoint(x, y) || el;
    if (!(target === el || el.contains?.(target))) target = el;
    const base = { bubbles: true, cancelable: true, composed: true, view: window, button: 0 };
    try {
      target.dispatchEvent(new PointerEvent("pointerdown", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 1 }));
    } catch (_) {}
    target.dispatchEvent(new MouseEvent("mousedown", { ...base, buttons: 1 }));
    try {
      target.dispatchEvent(new PointerEvent("pointerup", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 0 }));
    } catch (_) {}
    target.dispatchEvent(new MouseEvent("mouseup", { ...base, buttons: 0 }));
    target.dispatchEvent(new MouseEvent("click", { ...base, buttons: 0, detail: 1 }));
    await sleep(100);
    return true;
  };

  const setNativeSelectOption = (select, optionText) => {
    if (!select || select.tagName !== "SELECT") return false;
    const wanted = norm(optionText);
    const option = Array.from(select.options || []).find(o => norm(o.textContent) === wanted);
    if (!option) return false;
    select.value = option.value;
    option.selected = true;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  const findMenuNearControl = (control, hints = []) => {
    if (!control) return null;
    const cr = control.getBoundingClientRect();
    const wanted = hints.map(norm).filter(Boolean);
    const candidates = Array.from(document.querySelectorAll('[role="listbox"],[role="menu"],div,ul'))
      .filter(el => {
        if (!visible(el) || el === control || control.contains?.(el)) return false;
        const r = el.getBoundingClientRect();
        const nearX = r.right >= cr.left - 40 && r.left <= cr.right + 40;
        const nearY = r.top >= cr.top - 30 && r.top <= cr.bottom + 180;
        const sizeOK = r.width >= Math.max(120, cr.width * 0.55) && r.height >= 40;
        if (!(nearX && nearY && sizeOK)) return false;
        if (!wanted.length) return true;
        const t = norm(el.textContent);
        return wanted.some(x => t.includes(x)) || el.scrollHeight > el.clientHeight + 20;
      });
    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const ad = Math.abs(ar.top - cr.bottom) + Math.abs(ar.left - cr.left) * 0.2;
      const bd = Math.abs(br.top - cr.bottom) + Math.abs(br.left - cr.left) * 0.2;
      return ad - bd || ar.width * ar.height - br.width * br.height;
    });
    return candidates[0] || null;
  };

  const waitForMenuNearControl = async (control, hints = [], timeout = 1800) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const menu = findMenuNearControl(control, hints);
      if (menu) return menu;
      await sleep(60);
    }
    return null;
  };

  const optionTargets = (textEl, menu) => {
    if (!textEl) return [];
    const targets = [];
    let node = textEl;
    const mr = menu?.getBoundingClientRect?.();
    for (let i = 0; i < 9 && node && node !== menu; i++, node = node.parentElement) {
      const r = node.getBoundingClientRect();
      const rowSized = r.height >= 18 && r.height <= 70 && (!mr || r.width >= mr.width * 0.45);
      if (node.matches?.('[role="option"],[role="menuitem"],[role="menuitemradio"],[role="menuitemcheckbox"]')) targets.unshift(node);
      else if (rowSized && node.hasAttribute?.("jsaction")) targets.push(node);
      else if (rowSized && node.hasAttribute?.("tabindex")) targets.push(node);
      else if (rowSized) targets.push(node);
    }
    targets.push(textEl);
    return [...new Set(targets)];
  };

  const selectOptionFromMenu = async (menu, optionText, verifyFn = null) => {
    if (!menu) return false;
    const textEl = await scrollFindText(menu, optionText);
    if (!textEl) return false;
    try { textEl.scrollIntoView({ block: "center", behavior: "auto" }); } catch (_) {}
    await sleep(50);
    const targets = optionTargets(textEl, menu);
    for (const target of targets) {
      await fullGoogleClick(target);
      for (let i = 0; i < 8; i++) {
        if (verifyFn && verifyFn()) return true;
        if (!verifyFn && !visible(menu)) return true;
        await sleep(60);
      }
      try { target.click(); } catch (_) {}
      await sleep(100);
      if (verifyFn && verifyFn()) return true;
      if (!verifyFn && !visible(menu)) return true;
    }
    return verifyFn ? Boolean(verifyFn()) : false;
  };

  const rowLikeAncestor = (textEl, container = null) => {
    if (!textEl) return null;
    const containerRect = container?.getBoundingClientRect?.();
    let node = textEl;
    let best = null;
    for (let i = 0; i < 8 && node && node !== container; i++, node = node.parentElement) {
      const r = node.getBoundingClientRect();
      const sameText = norm(node.textContent) === norm(textEl.textContent);
      const rowWidthOK = !containerRect || r.width >= containerRect.width * 0.55;
      if (sameText && rowWidthOK && r.height >= 18 && r.height <= 64) best = node;
      if (node.matches?.('[role="option"],[role="menuitem"],[role="menuitemradio"],[role="menuitemcheckbox"]')) return node;
    }
    return best || textEl.parentElement || textEl;
  };

  const clickOptionByText = async (text, root = document) => {
    const textEl = exactText(text, root);
    if (!textEl) return false;
    const row = rowLikeAncestor(textEl, root);
    if (await clickEl(row)) return true;
    return clickEl(textEl);
  };

  const findScrollableMenuContaining = terms => {
    const wanted = terms.map(norm);
    const cands = Array.from(document.querySelectorAll("div,ul"))
      .filter(el => {
        if (!visible(el) || el.scrollHeight <= el.clientHeight + 25) return false;
        const t = norm(el.textContent);
        return wanted.filter(x => t.includes(x)).length >= Math.min(2, wanted.length);
      });
    cands.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return ar.width * ar.height - br.width * br.height;
    });
    return cands[0] || null;
  };

  const scrollFindText = async (menu, text) => {
    let found = exactText(text, menu);
    if (found) return found;
    const max = Math.max(0, menu.scrollHeight - menu.clientHeight);
    const step = Math.max(100, Math.floor(menu.clientHeight * 0.5));
    for (let y = 0; y <= max; y += step) {
      menu.scrollTop = y;
      menu.dispatchEvent(new Event("scroll", { bubbles: true }));
      await sleep(45);
      found = exactText(text, menu);
      if (found) return found;
    }
    menu.scrollTop = max;
    await sleep(60);
    return exactText(text, menu);
  };

  const findControlBelowLabel = (labelText, maxDistance = 110) => {
    const label = exactText(labelText);
    if (!label) return null;
    const lr = label.getBoundingClientRect();
    const cands = Array.from(document.querySelectorAll('[role="combobox"],[role="button"],[aria-haspopup],[aria-expanded],[tabindex],[jsaction],select'))
      .filter(el => {
        if (!visible(el)) return false;
        const r = el.getBoundingClientRect();
        return r.top >= lr.bottom - 12 && r.top <= lr.bottom + maxDistance && r.width > 150;
      });
    cands.sort((a, b) => Math.abs(a.getBoundingClientRect().top - lr.bottom) - Math.abs(b.getBoundingClientRect().top - lr.bottom));
    return cands[0] || null;
  };

  const selectDropdownOption = async (labelText, optionText, menuHints = []) => {
    const existing = exactText(optionText);
    const label = exactText(labelText);
    if (existing && label) {
      const er = existing.getBoundingClientRect();
      const lr = label.getBoundingClientRect();
      if (er.top > lr.bottom - 10 && er.top < lr.bottom + 100) return true;
    }

    const control = findControlBelowLabel(labelText);
    if (!control) return false;
    await clickEl(control);
    await sleep(150);

    let menu = findScrollableMenuContaining(menuHints.length ? menuHints : [optionText, "law"]);
    if (!menu) {
      // Some Google menus are not scrollable until enough items render.
      const option = exactText(optionText);
      if (option) return clickEl(rowLikeAncestor(option));
      return false;
    }

    const option = await scrollFindText(menu, optionText);
    if (!option) return false;
    const row = rowLikeAncestor(option, menu);
    await clickEl(row);
    await sleep(250);
    return true;
  };

  /* ------------------------------ UI ------------------------------ */

  const applyStyles = (el, styles) => {
    Object.assign(el.style, styles);
    return el;
  };

  const makeEl = (tag, attrs = {}, styles = {}) => {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "text") el.textContent = value;
      else if (key === "className") el.className = value;
      else if (key === "value") el.value = value;
      else if (key === "type") el.type = value;
      else if (key.startsWith("data-")) el.setAttribute(key, value);
      else el.setAttribute(key, value);
    }
    applyStyles(el, styles);
    return el;
  };

  const fieldBlock = (labelText, control) => {
    const label = makeEl("label", {}, {
      display: "block",
      marginBottom: "8px"
    });
    const title = makeEl("span", { text: labelText });
    label.appendChild(title);
    applyStyles(control, {
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      marginTop: "4px",
      padding: "8px",
      border: "1px solid #dadce0",
      borderRadius: "5px",
      background: "#fff",
      color: "#202124"
    });
    label.appendChild(control);
    return label;
  };

  const renderUI = () => {
    document.getElementById(UI_ID)?.remove();
    const s = state();

    const wrap = makeEl("div", { id: UI_ID }, {
      position: "fixed",
      right: "18px",
      top: "90px",
      bottom: "auto",
      zIndex: "2147483647",
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#202124"
    });

    const card = makeEl("div", {}, {
      width: s.active ? "300px" : "330px",
      background: "#fff",
      border: "1px solid #dadce0",
      borderRadius: "10px",
      boxShadow: "0 4px 18px rgba(0,0,0,.22)",
      padding: s.active ? "12px" : "14px"
    });
    wrap.appendChild(card);

    const title = makeEl("div", { text: "Martine LSA Master" }, {
      fontWeight: "700",
      fontSize: s.active ? "13px" : "15px",
      marginBottom: s.active ? "6px" : "10px"
    });
    card.appendChild(title);

    if (s.active) {
      const marketName = makeEl("div", {
        text: MARKETS[s.market]?.label || s.market || ""
      }, {
        marginBottom: "4px"
      });
      card.appendChild(marketName);

      const status = makeEl("div", {
        text: statusText,
        "data-role": "status"
      }, {
        fontSize: "12px",
        color: "#5f6368",
        marginBottom: "10px"
      });
      card.appendChild(status);

      const stopBtn = makeEl("button", {
        text: "Stop automation",
        type: "button",
        "data-action": "stop"
      }, {
        border: "0",
        borderRadius: "6px",
        padding: "8px 12px",
        background: "#d93025",
        color: "#fff",
        cursor: "pointer"
      });
      stopBtn.addEventListener("click", () => {
        patchState({ active: false });
        setStatus("Stopped");
        renderUI();
      });
      card.appendChild(stopBtn);
    } else {
      const marketSelect = makeEl("select", {
        "data-field": "market"
      });
      for (const [key, market] of Object.entries(MARKETS)) {
        const option = makeEl("option", {
          value: key,
          text: market.label
        });
        marketSelect.appendChild(option);
      }
      card.appendChild(fieldBlock("Market", marketSelect));

      const locationSelect = makeEl("select", {
        "data-field": "address"
      });

      const populateLocations = () => {
        while (locationSelect.firstChild) locationSelect.removeChild(locationSelect.firstChild);
        const placeholder = makeEl("option", { value: "", text: "Select office location" });
        locationSelect.appendChild(placeholder);
        const locations = OFFICE_LOCATIONS[marketSelect.value] || [];
        for (const loc of locations) {
          locationSelect.appendChild(makeEl("option", { value: loc.address, text: `${loc.address} — ${loc.city || ""}`.replace(/ — $/, "") }));
        }
        if (!locations.length) {
          locationSelect.appendChild(makeEl("option", { value: "", text: "No locations configured yet", disabled: "disabled" }));
        }
      };
      card.appendChild(fieldBlock("Street / full address", locationSelect));

      const zipInput = makeEl("input", {
        type: "text",
        "data-field": "zip",
        autocomplete: "postal-code",
        placeholder: "Auto-filled from selected office"
      });
      card.appendChild(fieldBlock("ZIP code", zipInput));

      const phoneInput = makeEl("input", {
        type: "text",
        "data-field": "phone",
        autocomplete: "tel",
        placeholder: "Auto-filled from selected office"
      });
      const phoneBlock = fieldBlock("Phone", phoneInput);
      phoneBlock.style.marginBottom = "10px";
      card.appendChild(phoneBlock);

      const syncLocationFields = () => {
        const locations = OFFICE_LOCATIONS[marketSelect.value] || [];
        const loc = locations.find(x => x.address === locationSelect.value);
        if (!loc) {
          zipInput.value = "";
          phoneInput.value = "";
          return;
        }
        zipInput.value = loc.zip || "";
        phoneInput.value = loc.phone || "";
      };

      marketSelect.addEventListener("change", () => {
        populateLocations();
        zipInput.value = "";
        phoneInput.value = "";
      });
      locationSelect.addEventListener("change", syncLocationFields);
      populateLocations();

      const startBtn = makeEl("button", {
        text: "Start automation",
        type: "button",
        "data-action": "start"
      }, {
        border: "0",
        borderRadius: "6px",
        padding: "9px 13px",
        background: "#1a73e8",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600"
      });
      card.appendChild(startBtn);

      const note = makeEl("div", {
        text: "This tab has its own independent automation run. Progress persists across Google page navigation in this tab only. Office selection auto-fills ZIP and mapped phone for configured locations."
      }, {
        fontSize: "11px",
        color: "#5f6368",
        marginTop: "8px"
      });
      card.appendChild(note);

      startBtn.addEventListener("click", () => {
        const market = marketSelect.value;
        const zip = zipInput.value.trim();
        const phone = phoneInput.value.trim();
        const address = locationSelect.value.trim();

        if (!market || !zip || !phone || !address) {
          alert("Please select an office location. ZIP and Phone auto-fill from the mapping; if a phone is not mapped yet, enter it manually.");
          return;
        }

        const selectedOffice = (OFFICE_LOCATIONS[market] || []).find(x => x.address === address) || null;
        saveState({
          active: true,
          market,
          zip,
          phone,
          address,
          city: selectedOffice?.city || "",
          officeState: selectedOffice?.state || MARKETS[market]?.state || "",
          startedAt: Date.now(),
          serviceTypesConfigured: false,
          serviceTypesWaitingForAgreement: false,
          serviceTypesConfiguredAt: null,
          businessHoursConfigured: false,
          businessHoursConfiguredAt: null,
          createAccountPrepared: false,
          createAccountPreparedAt: null
        });
        statusText = "Starting…";
        renderUI();
        cycle();
      });
    }

    (document.body || document.documentElement).appendChild(wrap);
  };

  /* --------------------------- Page detection --------------------------- */

  const detectPage = () => {
    const t = pageText();
    if (t.includes("create an account") && t.includes("continue creating a new account")) return "create-account";
    if (t.includes("business details") && t.includes("owner's first name")) return "business-details";
    if (t.includes("select services you offer")) return "service-types";
    if (t.includes("business hours") && t.includes("monday") && t.includes("sunday")) return "business-hours";
    if (t.includes("include these service areas") || t.includes("set up your service area")) return "service-area";
    if (t.includes("eligibility") && t.includes("job category") && t.includes("check eligibility")) return "eligibility";
    if (t.includes("preview your ad")) return "preview";
    return "unknown";
  };

  // Every page handler is cancellable. Google LSA replaces the current step
  // without necessarily reloading the whole document, so an async handler from
  // the previous step can otherwise keep typing/clicking after navigation.
  class StageChangedError extends Error {
    constructor(expected, actual) {
      super(`LSA stage changed from ${expected} to ${actual}`);
      this.name = "StageChangedError";
      this.expected = expected;
      this.actual = actual;
      this.isStageChange = true;
    }
  }

  const assertPage = expected => {
    const actual = detectPage();
    if (actual !== expected) throw new StageChangedError(expected, actual);
    return true;
  };

  const sleepOnPage = async (ms, expected, chunk = 100) => {
    let left = ms;
    while (left > 0) {
      assertPage(expected);
      const wait = Math.min(chunk, left);
      await sleep(wait);
      left -= wait;
    }
    assertPage(expected);
  };

  const waitForPageExit = async (expected, timeout = 7000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (detectPage() !== expected) return true;
      await sleep(100);
    }
    return detectPage() !== expected;
  };

  /* ---------------------------- Eligibility ---------------------------- */

  const findStateControl = marketState => {
    const zip = findInputByLabel("ZIP code") || Array.from(document.querySelectorAll("input")).find(el => visible(el) && norm(el.getAttribute("aria-label")).includes("zip"));
    const zr = zip?.getBoundingClientRect?.();

    // Native select in the same row is the most reliable path.
    const native = Array.from(document.querySelectorAll("select")).find(sel => {
      const r = sel.getBoundingClientRect();
      if (!zr) return visible(sel) && Array.from(sel.options || []).some(o => norm(o.textContent) === norm(marketState));
      return r.top < zr.bottom + 25 && r.bottom > zr.top - 25 && r.right <= zr.left + 80;
    });
    if (native) return native;

    for (const text of [marketState, "State"]) {
      const matches = allExactText(text).filter(el => {
        if (!zr) return true;
        const r = el.getBoundingClientRect();
        const cy = r.top + r.height / 2;
        return cy >= zr.top - 25 && cy <= zr.bottom + 25 && r.left < zr.left;
      });
      for (const match of matches) {
        const field = visualFieldAncestor(match);
        if (field) return field;
      }
    }

    // Final geometric fallback: a dropdown-like control left of ZIP on the same row.
    if (zr) {
      const candidates = Array.from(document.querySelectorAll('select,[role="combobox"],[role="button"],[aria-haspopup],[aria-expanded],[tabindex],[jsaction]'))
        .filter(el => {
          if (!visible(el)) return false;
          const r = el.getBoundingClientRect();
          const sameRow = r.top < zr.bottom + 20 && r.bottom > zr.top - 20;
          return sameRow && r.right <= zr.left + 90 && r.width >= 120 && r.height >= 28 && r.height <= 85;
        });
      candidates.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
      if (candidates[0]) return candidates[0];
    }
    return null;
  };

  const stateFieldShows = marketState => {
    const zip = findInputByLabel("ZIP code") || Array.from(document.querySelectorAll("input")).find(el => visible(el) && norm(el.getAttribute("aria-label")).includes("zip"));
    const zr = zip?.getBoundingClientRect?.();
    return allExactText(marketState).some(el => {
      const r = el.getBoundingClientRect();
      if (!zr) return visible(el);
      const cy = r.top + r.height / 2;
      return cy >= zr.top - 25 && cy <= zr.bottom + 25 && r.left < zr.left;
    });
  };

  const setEligibilityState = async marketState => {
    if (stateFieldShows(marketState)) return true;
    setStatus(`Eligibility: selecting ${marketState}`);
    let control = findStateControl(marketState);
    if (!control) return false;

    const native = control.tagName === "SELECT" ? control : control.querySelector?.("select");
    if (native && setNativeSelectOption(native, marketState)) {
      await sleep(180);
      if (stateFieldShows(marketState)) return true;
    }

    // Open the visible field. Google sometimes listens to mousedown instead of click.
    await fullGoogleClick(control);
    let menu = await waitForMenuNearControl(control, [marketState, "alabama", "texas", "california"], 2000);
    if (!menu) {
      try { control.click(); } catch (_) {}
      menu = await waitForMenuNearControl(control, [marketState, "alabama", "texas", "california"], 1400);
    }
    if (!menu) return false;

    const ok = await selectOptionFromMenu(menu, marketState, () => stateFieldShows(marketState));
    if (ok) return true;

    // A final native-select check after Google has opened/rendered the field.
    control = findStateControl(marketState);
    const retryNative = control?.tagName === "SELECT" ? control : control?.querySelector?.("select");
    if (retryNative && setNativeSelectOption(retryNative, marketState)) {
      await sleep(180);
      return stateFieldShows(marketState);
    }
    return false;
  };

  const ensureStateAndZip = async (s, market) => {
    setStatus(`Eligibility: ${market.state} / ${s.zip}`);

    if (!stateFieldShows(market.state)) {
      const ok = await setEligibilityState(market.state);
      if (!ok) throw new Error(`Could not set State = ${market.state}`);
      await sleep(180);
    }

    const zipInput = findInputByLabel("ZIP code") || Array.from(document.querySelectorAll("input")).find(el => visible(el) && norm(el.getAttribute("aria-label")).includes("zip"));
    if (!zipInput) throw new Error("ZIP input not found");
    if (String(zipInput.value) !== String(s.zip)) {
      nativeSet(zipInput, s.zip);
      zipInput.blur();
      await sleep(100);
    }
  };

  const findJobCategoryControl = () => {
    const label = exactText("Job category");
    if (!label) return null;
    const lr = label.getBoundingClientRect();

    // Native select if Google exposes one.
    const native = Array.from(document.querySelectorAll("select")).find(sel => {
      const r = sel.getBoundingClientRect();
      return r.top >= lr.bottom - 15 && r.top <= lr.bottom + 110 && r.width >= 180;
    });
    if (native) return native;

    for (const text of ["Law", "Select"]) {
      const matches = allExactText(text).filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= lr.bottom - 15 && r.top <= lr.bottom + 110;
      });
      for (const match of matches) {
        const field = visualFieldAncestor(match);
        if (field) return field;
      }
    }

    const candidates = Array.from(document.querySelectorAll('[role="combobox"],[role="button"],[aria-haspopup],[aria-expanded],[tabindex],[jsaction]'))
      .filter(el => {
        if (!visible(el)) return false;
        const r = el.getBoundingClientRect();
        return r.top >= lr.bottom - 15 && r.top <= lr.bottom + 110 && r.width >= 180 && r.height >= 25 && r.height <= 85;
      });
    candidates.sort((a, b) => Math.abs(a.getBoundingClientRect().top - lr.bottom) - Math.abs(b.getBoundingClientRect().top - lr.bottom));
    return candidates[0] || null;
  };

  const findCategoryMenu = control => {
    const near = control ? findMenuNearControl(control, ["law", "landscaping", "locksmith", "language instruction"]) : null;
    if (near) return near;
    return findScrollableMenuContaining(["landscaping", "language instruction", "law", "locksmith"]);
  };

  const jobCategoryIsLaw = () => {
    if (exactText("Criminal law")) return true;
    const control = findJobCategoryControl();
    const menu = findCategoryMenu(control);
    if (menu && visible(menu)) return false;
    const label = exactText("Job category");
    if (!label) return false;
    const lr = label.getBoundingClientRect();
    return allExactText("Law").some(el => {
      const r = el.getBoundingClientRect();
      return r.top >= lr.bottom - 15 && r.top <= lr.bottom + 100;
    });
  };

  const chooseLaw = async () => {
    if (jobCategoryIsLaw()) return true;
    setStatus("Eligibility: opening Job category");
    let control = findJobCategoryControl();
    if (!control) return false;

    const native = control.tagName === "SELECT" ? control : control.querySelector?.("select");
    if (native && setNativeSelectOption(native, "Law")) {
      for (let i = 0; i < 12; i++) {
        if (jobCategoryIsLaw() || exactText("Criminal law")) return true;
        await sleep(80);
      }
    }

    // First make the selector visibly open, then locate Law inside that menu.
    await fullGoogleClick(control);
    let menu = await waitForMenuNearControl(control, ["law", "landscaping", "locksmith", "language instruction"], 2000);
    if (!menu) {
      try { control.click(); } catch (_) {}
      menu = await waitForMenuNearControl(control, ["law", "landscaping", "locksmith", "language instruction"], 1400);
    }
    if (!menu) {
      setStatus("Manual action needed: open Job category; automation will resume");
      return false;
    }

    setStatus("Eligibility: selecting Law");
    const ok = await selectOptionFromMenu(menu, "Law", () => jobCategoryIsLaw() || Boolean(exactText("Criminal law")));
    if (ok) return true;

    // Google may rebuild the menu after the first click, so reacquire and retry once.
    control = findJobCategoryControl() || control;
    menu = findCategoryMenu(control);
    if (!menu) {
      await fullGoogleClick(control);
      menu = await waitForMenuNearControl(control, ["law", "landscaping", "locksmith"], 1200);
    }
    if (menu) {
      const retry = await selectOptionFromMenu(menu, "Law", () => jobCategoryIsLaw() || Boolean(exactText("Criminal law")));
      if (retry) return true;
    }

    setStatus("Manual action needed: click Law; automation will resume");
    return false;
  };

  const practiceBinding = name => {
    const text = exactText(name);
    if (!text) return null;
    if (text.tagName === "LABEL") {
      const f = text.getAttribute("for");
      if (f) {
        const control = document.getElementById(f);
        if (control) return { text, control, clickTarget: text };
      }
    }
    let node = text;
    for (let i = 0; i < 7 && node; i++, node = node.parentElement) {
      const controls = Array.from(node.querySelectorAll?.('input[type="checkbox"],[role="checkbox"],[aria-checked]') || []);
      if (controls.length === 1) return { text, control: controls[0], clickTarget: node };
    }
    return null;
  };

  const checked = control => {
    if (!control) return false;
    if (typeof control.checked === "boolean") return control.checked;
    return control.getAttribute("aria-checked") === "true";
  };

  const ensureCheckedLabel = async name => {
    let b = practiceBinding(name);
    if (!b) return false;
    if (checked(b.control)) return true;
    try { b.control.click(); } catch (_) {}
    await sleep(80);
    b = practiceBinding(name);
    if (b && checked(b.control)) return true;
    try { b.clickTarget.click(); } catch (_) {}
    await sleep(80);
    b = practiceBinding(name);
    return Boolean(b && checked(b.control));
  };

  const handleEligibility = async () => {
    const s = state();
    const market = MARKETS[s.market];
    await ensureStateAndZip(s, market);

    const lawOK = await chooseLaw();
    if (!lawOK && !exactText("Criminal law")) return;

    // No fixed wait. Continue as soon as the practice area exists.
    for (let i = 0; i < 50 && !exactText("Criminal law"); i++) await sleep(100);
    if (!exactText("Criminal law")) throw new Error("Practice Areas did not load");

    setStatus("Eligibility: checking practice areas");
    for (const name of ["Criminal law", "Family law", "Dui law", "Traffic law"]) {
      if (!(await ensureCheckedLabel(name))) throw new Error(`Could not check ${name}`);
    }

    const btn = buttonByText("Check Eligibility");
    if (!btn) throw new Error("Check Eligibility button not found");
    setStatus("Eligibility complete — continuing");
    await clickEl(btn);
  };

  /* ---------------------------- Create account ---------------------------- */

  const ensureRadioByText = async text => {
    const label = exactText(text);
    if (!label) return false;
    let node = label;
    for (let i = 0; i < 6 && node; i++, node = node.parentElement) {
      const radio = node.querySelector?.('input[type="radio"],[role="radio"],[aria-checked]');
      if (radio) {
        const isOn = typeof radio.checked === "boolean" ? radio.checked : radio.getAttribute("aria-checked") === "true";
        if (isOn) return true;
        try { radio.click(); } catch (_) { await clickEl(label); }
        await sleep(100);
        return true;
      }
    }
    await clickEl(label);
    return true;
  };

  const handleCreateAccount = async () => {
    // HARD MANUAL HANDOFF.
    // This handler NEVER clicks Next. A capture-phase guard installed below also
    // blocks any synthetic/untrusted click on the Create-account Next button.
    // Only a real user click (event.isTrusted === true) is allowed through.
    const s = state();

    if (!s.createAccountPrepared) {
      setStatus("Create account: preparing new-account option");
      const selected = await ensureRadioByText("Continue creating a new account");
      if (!selected) {
        throw new Error('Could not select "Continue creating a new account"');
      }
      patchState({ createAccountPrepared: true, createAccountPreparedAt: Date.now() });
    }

    setStatus('Create account ready — click Next manually to continue');
  };

  /* ---------------------------- Business details ---------------------------- */

  const setLabeledInput = async (label, value) => {
    const input = findInputByLabel(label);
    if (!input) return false;
    if (String(input.value) === String(value)) return true;
    nativeSet(input, value);
    input.blur();
    await sleep(70);
    return String(input.value) === String(value);
  };

  const phoneDigits = value => String(value || "").replace(/\D/g, "");

  const sameUSPhone = (a, b) => {
    const da = phoneDigits(a);
    const db = phoneDigits(b);
    if (!da || !db) return false;
    const aa = da.length >= 10 ? da.slice(-10) : da;
    const bb = db.length >= 10 ? db.slice(-10) : db;
    return aa === bb;
  };

  const findBusinessPhoneInput = () => {
    const direct = findInputByLabel("Business phone");
    if (direct) return direct;

    const label = exactText("Business phone");
    if (!label) return null;
    let node = label;
    for (let i = 0; i < 8 && node; i++, node = node.parentElement) {
      const inputs = Array.from(node.querySelectorAll?.('input[type="tel"],input') || []).filter(visible);
      if (inputs.length === 1) return inputs[0];
    }

    const lr = label.getBoundingClientRect();
    const nearby = Array.from(document.querySelectorAll('input[type="tel"],input')).filter(el => {
      if (!visible(el)) return false;
      const r = el.getBoundingClientRect();
      return r.top >= lr.top - 25 && r.top <= lr.bottom + 70 && Math.abs(r.left - lr.left) < 260;
    });
    nearby.sort((a, b) => Math.abs(a.getBoundingClientRect().top - lr.bottom) - Math.abs(b.getBoundingClientRect().top - lr.bottom));
    return nearby[0] || null;
  };

  const businessPhoneVisibleMatches = phone => {
    const wanted = phoneDigits(phone);
    if (!wanted) return false;
    const last10 = wanted.slice(-10);
    return Array.from(document.querySelectorAll('span,div,p,label')).some(el => {
      if (!visible(el)) return false;
      const digits = phoneDigits(el.textContent);
      return digits.length >= 10 && digits.slice(-10) === last10;
    });
  };

  const setBusinessPhone = async value => {
    const input = findBusinessPhoneInput();
    if (input && sameUSPhone(input.value, value)) return true;
    if (!input && businessPhoneVisibleMatches(value)) return true;
    if (!input) return false;

    nativeSet(input, value);
    input.blur();
    await sleep(120);

    if (sameUSPhone(input.value, value)) return true;
    if (businessPhoneVisibleMatches(value)) return true;
    return false;
  };

  const closeGetMoreCustomersPopup = async () => {
    const title = exactText("Get more customers");
    if (!title) return true;

    setStatus("Business details: closing Get started popup");
    let btn = buttonByText("Get started");
    if (!btn) {
      const candidates = allExactText("Get started");
      btn = candidates[0] || null;
    }
    if (!btn) return false;

    await clickEl(btn);
    for (let i = 0; i < 20; i++) {
      await sleep(100);
      if (!exactText("Get more customers")) return true;
    }

    await fullGoogleClick(btn);
    for (let i = 0; i < 15; i++) {
      await sleep(100);
      if (!exactText("Get more customers")) return true;
    }
    return !exactText("Get more customers");
  };

  // Language logic is based on the version that worked in your Business Details testing.
  const findLanguageTrigger = () => {
    const text = exactText("Languages Spoken");
    if (text) {
      let node = text;
      for (let i = 0; i < 8 && node; i++, node = node.parentElement) {
        const r = node.getBoundingClientRect();
        if (r.width > 200 && r.height < 100 && (node.matches?.('[role="combobox"],[role="button"],[aria-haspopup],[aria-expanded],[tabindex]') || node.hasAttribute?.("jsaction"))) return node;
      }
    }

    const year = exactText("Year founded");
    const street = Array.from(document.querySelectorAll("input")).find(el => visible(el) && norm(el.placeholder) === "street address");
    const minY = year ? year.getBoundingClientRect().bottom : 0;
    const maxY = street ? street.getBoundingClientRect().top : Infinity;
    const cands = Array.from(document.querySelectorAll('[role="combobox"],[role="button"],[aria-haspopup],[aria-expanded],[tabindex],[jsaction]'))
      .filter(el => {
        if (!visible(el)) return false;
        const r = el.getBoundingClientRect();
        return r.top >= minY - 20 && r.bottom <= maxY + 20 && r.width > 200 && r.height < 100;
      });
    cands.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
    return cands[0] || null;
  };

  const findLanguageMenu = () => findScrollableMenuContaining(["english", "french", "german", "spanish", "portuguese"]);

  const getSelectedLanguageData = () => {
    const vals = [];
    for (const el of document.querySelectorAll('[selected-option-names],[data-selected-option-names]')) {
      const a = el.getAttribute("selected-option-names");
      const b = el.getAttribute("data-selected-option-names");
      if (a) vals.push(a);
      if (b) vals.push(b);
    }
    return vals;
  };

  const parseSelectedNames = raw => {
    if (!raw) return [];
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map(norm);
      if (typeof p === "string") return [norm(p)];
    } catch (_) {}
    return String(raw).replace(/^\[/, "").replace(/\]$/, "").split(",")
      .map(x => norm(x.replace(/^["']/, "").replace(/["']$/, ""))).filter(Boolean);
  };

  const selectedLanguages = () => {
    const set = new Set();
    for (const raw of getSelectedLanguageData()) for (const name of parseSelectedNames(raw)) set.add(name);
    return set;
  };

  const selectedLanguagesFromDisplay = () => {
    const trigger = findLanguageTrigger();
    if (!trigger) return new Set();
    const display = String(trigger.innerText || trigger.textContent || "").replace(/\s+/g, " ").trim();
    if (!display || norm(display) === "languages spoken") return new Set();
    return new Set(display.split(",").map(norm).filter(Boolean));
  };

  const languageOptionState = row => {
    if (!row) return false;
    for (const el of [row, ...row.querySelectorAll('[aria-selected],[aria-checked],input[type="checkbox"]')]) {
      if (el.tagName === "INPUT" && typeof el.checked === "boolean" && el.checked) return true;
      if (el.getAttribute?.("aria-checked") === "true" || el.getAttribute?.("aria-selected") === "true") return true;
    }
    return false;
  };

  const languageSelected = (name, menu) => {
    const wanted = norm(name);
    if (selectedLanguages().has(wanted)) return true;
    if (selectedLanguagesFromDisplay().has(wanted)) return true;
    if (menu) {
      const text = exactText(name, menu);
      if (text && languageOptionState(rowLikeAncestor(text, menu))) return true;
    }
    return false;
  };

  const ensureLanguageMenuOpen = async () => {
    let menu = findLanguageMenu();
    if (menu) return menu;
    const trigger = findLanguageTrigger();
    if (!trigger) return null;
    await clickEl(trigger);
    for (let i = 0; i < 20; i++) {
      await sleep(50);
      menu = findLanguageMenu();
      if (menu) return menu;
    }
    return null;
  };

  const ensureLanguage = async (name, menu) => {
    menu = findLanguageMenu() || menu || await ensureLanguageMenuOpen();
    if (languageSelected(name, menu)) return true;
    if (!menu) return false;

    let text = await scrollFindText(menu, name);
    if (!text) return false;
    let row = rowLikeAncestor(text, menu);

    await fullGoogleClick(row);
    for (let i = 0; i < 10; i++) {
      menu = findLanguageMenu() || menu;
      if (languageSelected(name, menu)) return true;
      await sleep(45);
    }

    menu = findLanguageMenu() || menu || await ensureLanguageMenuOpen();
    if (menu) text = await scrollFindText(menu, name);
    if (text) {
      try { text.click(); } catch (_) {}
      for (let i = 0; i < 8; i++) {
        menu = findLanguageMenu() || menu;
        if (languageSelected(name, menu)) return true;
        await sleep(50);
      }

      await fullGoogleClick(text);
      for (let i = 0; i < 8; i++) {
        menu = findLanguageMenu() || menu;
        if (languageSelected(name, menu)) return true;
        await sleep(50);
      }
    }

    if (text?.parentElement) {
      try { text.parentElement.click(); } catch (_) {}
      for (let i = 0; i < 8; i++) {
        menu = findLanguageMenu() || menu;
        if (languageSelected(name, menu)) return true;
        await sleep(50);
      }
    }

    return languageSelected(name, findLanguageMenu());
  };

  const configureBusinessLanguages = async () => {
    const desired = ["English", "Spanish", "Spanish (Latin America)"];

    if (allBusinessLanguagesSelected()) {
      await closeLanguageMenu();
      return true;
    }

    let menu = await ensureLanguageMenuOpen();
    if (!menu) return false;

    for (const name of desired) {
      menu = findLanguageMenu() || await ensureLanguageMenuOpen();
      if (!menu) return false;
      if (!(await ensureLanguage(name, menu))) return false;
      await sleep(80);
    }

    const allSelectedWhileOpen = desired.every(name => languageSelected(name, findLanguageMenu() || menu));
    await closeLanguageMenu();
    await sleep(120);
    return allSelectedWhileOpen || allBusinessLanguagesSelected();
  };

  const closeLanguageMenu = async () => {
    if (!findLanguageMenu()) return true;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent("keyup", { key: "Escape", code: "Escape", bubbles: true }));
    await sleep(120);
    if (findLanguageMenu()) {
      const year = exactText("Year founded");
      if (year) await clickEl(year);
    }
    return !findLanguageMenu();
  };

  const visibleLanguageDisplaySet = () => {
    // When the selector is closed Google renders the selected languages as one visible line.
    // Read that line directly so a second automation cycle does not try to reopen the selector.
    const year = exactText("Year founded");
    const street = Array.from(document.querySelectorAll("input"))
      .find(el => visible(el) && norm(el.placeholder) === "street address");
    const minY = year ? year.getBoundingClientRect().bottom - 10 : 0;
    const maxY = street ? street.getBoundingClientRect().top + 10 : Infinity;

    const candidates = Array.from(document.querySelectorAll("span,div"))
      .filter(el => {
        if (!visible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.top < minY || r.bottom > maxY) return false;
        const t = norm(el.textContent);
        return t.includes("english") || t.includes("spanish");
      });

    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return ar.width * ar.height - br.width * br.height;
    });

    const found = new Set();
    for (const el of candidates) {
      const raw = String(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      for (const part of raw.split(",")) {
        const n = norm(part);
        if (n === "english" || n === "spanish" || n === "spanish (latin america)") found.add(n);
      }
      if (found.size >= 3) break;
    }
    return found;
  };

  const allBusinessLanguagesSelected = () => {
    const wanted = ["english", "spanish", "spanish (latin america)"];
    const byData = selectedLanguages();
    const byDisplay = visibleLanguageDisplaySet();
    return wanted.every(x => byData.has(x) || byDisplay.has(x));
  };

  const findStreetAddressInput = () => {
    const inputs = Array.from(document.querySelectorAll("input")).filter(visible);
    return inputs.find(el => norm(el.placeholder) === "street address")
      || inputs.find(el => norm(el.getAttribute("aria-label")).includes("street address"))
      || inputs.find(el => norm(el.getAttribute("aria-label")).includes("address"))
      || null;
  };

  const findCityInput = () => {
    return findInputByLabel("City")
      || Array.from(document.querySelectorAll("input")).find(el => visible(el) && norm(el.placeholder) === "city")
      || null;
  };

  const currentStateTextNearAddress = street => {
    const sr = street?.getBoundingClientRect?.();
    if (!sr) return "";
    const candidates = Array.from(document.querySelectorAll("span,div"))
      .filter(el => {
        if (!visible(el)) return false;
        const r = el.getBoundingClientRect();
        return r.top > sr.bottom && r.top < sr.bottom + 260 && r.width > 50 && r.height < 70;
      })
      .map(el => String(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    return candidates.join(" | ");
  };

  const officeCityNames = office => {
    return [office?.city, ...(office?.cityAliases || [])]
      .map(norm)
      .filter(Boolean);
  };

  const addressKeyTokens = address => {
    const ignored = new Set([
      "suite", "ste", "floor", "fl", "office", "building", "bldg", "unit", "no", "number",
      "first", "second", "third", "4th", "5th", "6th"
    ]);
    return norm(address)
      .replace(/[#(),]/g, " ")
      .split(" ")
      .filter(Boolean)
      .filter(token => !ignored.has(token))
      .slice(0, 6);
  };

  const addressSuggestionScore = (row, office) => {
    const t = norm(row?.textContent);
    if (!t) return -999;

    const keyTokens = addressKeyTokens(office.address);
    let score = 0;
    for (const token of keyTokens) {
      if (t.includes(token)) score += /^\d+$/.test(token) ? 8 : 3;
    }

    const cities = officeCityNames(office);
    if (cities.some(city => t.includes(city))) score += 30;
    if (office.zip && t.includes(norm(office.zip))) score += 12;
    if (office.state && t.includes(norm(office.state))) score += 8;
    if (office.stateCode) {
      const code = norm(office.stateCode);
      if (t.includes(`, ${code}`) || t.includes(` ${code},`) || t.includes(` ${code} `)) score += 7;
    }
    return score;
  };

  const suggestionRowAncestor = (el, street) => {
    if (!el) return null;
    if (el.matches?.('.pac-item,[role="option"],[data-item-index]')) return el;

    const sr = street?.getBoundingClientRect?.();
    let node = el;
    for (let i = 0; i < 7 && node; i++, node = node.parentElement) {
      if (node.matches?.('.pac-item,[role="option"],[data-item-index]')) return node;
      const r = node.getBoundingClientRect?.();
      if (!r) continue;
      const near = !sr || (r.top >= sr.bottom - 12 && r.top <= sr.bottom + 320);
      const rowSized = r.height >= 24 && r.height <= 80 && (!sr || r.width >= Math.max(160, sr.width * 0.65));
      if (near && rowSized && (node.hasAttribute?.("jsaction") || node.getAttribute?.("role") === "option")) return node;
    }
    return el;
  };

  const getAddressSuggestionRows = (street, office) => {
    if (!street) return [];
    const sr = street.getBoundingClientRect();
    const keyTokens = addressKeyTokens(office.address);

    // Google Places legacy autocomplete normally uses .pac-item. The other selectors
    // cover newer Local Services / Material renderers.
    const raw = Array.from(document.querySelectorAll(
      '.pac-item,[role="option"],[data-item-index],.pac-container > div,[role="listbox"] > div'
    )).filter(el => {
      if (!visible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.height < 20 || r.height > 100) return false;
      if (r.width < Math.max(140, sr.width * 0.55)) return false;
      if (r.top < sr.bottom - 12 || r.top > sr.bottom + 330) return false;
      const t = norm(el.textContent);
      if (!t) return false;
      const hits = keyTokens.filter(token => t.includes(token)).length;
      return hits >= Math.min(2, Math.max(1, keyTokens.length));
    });

    const unique = new Map();
    for (const el of raw) {
      const row = suggestionRowAncestor(el, street);
      if (!row || !visible(row)) continue;
      const r = row.getBoundingClientRect();
      const key = `${Math.round(r.top / 3) * 3}|${norm(row.textContent)}`;
      if (!unique.has(key)) unique.set(key, row);
    }

    return Array.from(unique.values())
      .map(row => ({ row, score: addressSuggestionScore(row, office), top: row.getBoundingClientRect().top }))
      .sort((a, b) => b.score - a.score || a.top - b.top);
  };

  const findAddressSuggestion = (street, office) => {
    return getAddressSuggestionRows(street, office)[0]?.row || null;
  };

  const addressFieldsPopulated = (office, street) => {
    const cityInput = findCityInput();
    const zipInput = findInputByLabel("ZIP code")
      || Array.from(document.querySelectorAll("input")).find(el => visible(el) && norm(el.getAttribute("aria-label")).includes("zip"));

    const cityValue = norm(cityInput?.value);
    const cities = officeCityNames(office);
    const cityOK = !cities.length || cities.includes(cityValue);

    const zipDigits = String(zipInput?.value || "").replace(/\D/g, "");
    const wantedZip = String(office.zip || "").replace(/\D/g, "");
    const zipOK = !wantedZip || zipDigits.startsWith(wantedZip);

    // City + ZIP are the most reliable evidence that Google accepted an autocomplete
    // suggestion. State is still checked when we can read it, but a hidden Material
    // select should not cause an otherwise correct address to loop forever.
    const stateText = norm(currentStateTextNearAddress(street));
    const stateNames = [norm(office.state || ""), norm(office.stateCode || "")].filter(Boolean);
    const stateOK = !stateNames.length || stateNames.some(x => stateText.includes(x));

    return Boolean(cityOK && zipOK && (stateOK || (cityOK && zipOK)));
  };

  const legacyKeyCode = key => ({
    ArrowDown: 40,
    ArrowUp: 38,
    Enter: 13,
    Escape: 27,
    " ": 32,
    Space: 32,
    Tab: 9
  }[key] || 0);

  const dispatchLegacyKeyboardEvent = (el, type, key, code = key) => {
    if (!el) return false;
    const kc = legacyKeyCode(key);
    let ev;
    try {
      ev = new KeyboardEvent(type, {
        key,
        code,
        bubbles: true,
        cancelable: true,
        composed: true
      });
    } catch (_) {
      ev = document.createEvent("KeyboardEvent");
      try { ev.initKeyboardEvent(type, true, true, window, key, 0, "", false, ""); } catch (_) {}
    }
    // Google's legacy Places key handler still reads keyCode/which. KeyboardEvent()
    // leaves those at 0 in Chromium, so expose the legacy values explicitly.
    for (const [prop, value] of [["keyCode", kc], ["which", kc], ["charCode", type === "keypress" ? kc : 0]]) {
      try { Object.defineProperty(ev, prop, { configurable: true, get: () => value }); } catch (_) {}
    }
    return el.dispatchEvent(ev);
  };

  const dispatchKey = (el, key, code = key) => {
    if (!el) return;
    dispatchLegacyKeyboardEvent(el, "keydown", key, code);
    if (key === "Enter" || key === " " || key === "Space") {
      dispatchLegacyKeyboardEvent(el, "keypress", key, code);
    }
    dispatchLegacyKeyboardEvent(el, "keyup", key, code);
  };

  const mouseEventAt = (type, target, x, y, buttons = 0) => {
    if (!target) return false;
    const ev = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      button: 0,
      buttons,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      detail: type === "click" ? 1 : 0
    });
    return target.dispatchEvent(ev);
  };

  const clickAddressSuggestion = async (street, office, suggestion) => {
    if (!suggestion) return false;

    // The screenshots show Google's legacy Places autocomplete renderer. Its actual
    // selectable unit is .pac-item and selection is normally committed on mousedown.
    const row = suggestion.closest?.(".pac-item") || suggestionRowAncestor(suggestion, street) || suggestion;
    try { row.scrollIntoView({ block: "nearest", behavior: "auto" }); } catch (_) {}
    await sleep(60);

    const r = row.getBoundingClientRect();
    const x = Math.max(r.left + 12, Math.min(r.right - 12, r.left + Math.min(120, r.width * 0.28)));
    const y = r.top + r.height / 2;
    const pointTarget = document.elementFromPoint(x, y) || row;

    const targets = [...new Set([pointTarget, row])];
    for (const target of targets) {
      // Hover first so Google's delegated autocomplete code treats this as the active row.
      mouseEventAt("mouseover", target, x, y, 0);
      mouseEventAt("mousemove", target, x, y, 0);
      await sleep(25);

      try {
        target.dispatchEvent(new PointerEvent("pointerdown", {
          bubbles: true, cancelable: true, composed: true, view: window,
          pointerId: 1, pointerType: "mouse", isPrimary: true,
          button: 0, buttons: 1, clientX: x, clientY: y
        }));
      } catch (_) {}
      mouseEventAt("mousedown", target, x, y, 1);

      // Legacy Places commonly commits on mousedown. Give it a chance before releasing.
      for (let i = 0; i < 8; i++) {
        if (addressFieldsPopulated(office, street)) return true;
        await sleep(50);
      }

      try {
        target.dispatchEvent(new PointerEvent("pointerup", {
          bubbles: true, cancelable: true, composed: true, view: window,
          pointerId: 1, pointerType: "mouse", isPrimary: true,
          button: 0, buttons: 0, clientX: x, clientY: y
        }));
      } catch (_) {}
      mouseEventAt("mouseup", target, x, y, 0);
      mouseEventAt("click", target, x, y, 0);
      try { HTMLElement.prototype.click.call(target); } catch (_) {}

      for (let i = 0; i < 18; i++) {
        if (addressFieldsPopulated(office, street)) return true;
        await sleep(75);
      }
    }

    return addressFieldsPopulated(office, street);
  };

  const keyboardSelectAddressSuggestion = async (street, office) => {
    // Sort by visual order so ArrowDown count exactly matches Google's visible list.
    const candidatesByTop = getAddressSuggestionRows(street, office)
      .sort((a, b) => a.top - b.top);
    if (!candidatesByTop.length) return false;

    const best = [...candidatesByTop]
      .sort((a, b) => b.score - a.score || a.top - b.top)[0];
    const targetIndex = Math.max(0, candidatesByTop.findIndex(x => x.row === best.row));

    street.focus();
    await sleep(80);

    // Google Places' legacy handler reads event.keyCode (40/13), not only event.key.
    // One ArrowDown selects the first visible prediction; add more only when the best
    // city match is lower in the list.
    for (let i = 0; i <= targetIndex; i++) {
      dispatchKey(street, "ArrowDown", "ArrowDown");
      await sleep(110);
    }

    dispatchKey(street, "Enter", "Enter");

    for (let i = 0; i < 40; i++) {
      if (addressFieldsPopulated(office, street)) return true;
      await sleep(75);
    }
    return false;
  };

  const fillAddress = async (s, market) => {
    if (!s.address) return false;

    const office = (OFFICE_LOCATIONS[s.market] || []).find(x => x.address === s.address) || {
      address: s.address,
      city: s.city || "",
      state: s.officeState || market.state,
      stateCode: "",
      zip: s.zip || "",
      phone: s.phone || ""
    };

    const street = findStreetAddressInput();
    if (!street) return false;

    // If Google already accepted the Places prediction on a previous cycle, do not
    // touch the street field again.
    if (addressFieldsPopulated(office, street)) return true;

    const desired = office.address.trim();
    const current = String(street.value || "").trim();
    const currentNorm = norm(current);
    const desiredNorm = norm(desired);

    // Type once only. The master cycle may retry after an error, but we keep the
    // existing text and only retry prediction selection so it cannot loop typing.
    if (!current || currentNorm !== desiredNorm) {
      street.focus();
      nativeSet(street, desired);
      try {
        street.dispatchEvent(new InputEvent("input", {
          bubbles: true,
          composed: true,
          inputType: "insertText",
          data: desired
        }));
      } catch (_) {
        street.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      }
      street.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    } else {
      street.focus();
      // Re-open Places suggestions without altering the visible address.
      street.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }

    let suggestion = null;
    for (let i = 0; i < 50; i++) {
      suggestion = findAddressSuggestion(street, office);
      if (suggestion) break;
      await sleep(100);
    }

    if (!suggestion) {
      setStatus(`Needs review: waiting for Google address suggestion for ${office.city || office.address}`);
      return false;
    }

    setStatus(`Business details: selecting ${office.city || "address"} suggestion`);

    // First use Google's own keyboard navigation. This is the most reliable path for
    // the legacy .pac-item renderer shown in the screenshots and now includes the
    // legacy keyCode/which values that Google's handler expects.
    if (await keyboardSelectAddressSuggestion(street, office)) return true;

    // If Google ignored keyboard navigation, click the exact scored .pac-item with
    // proper client coordinates and a mousedown-first sequence.
    suggestion = findAddressSuggestion(street, office) || suggestion;
    if (await clickAddressSuggestion(street, office, suggestion)) return true;

    // One final wait in case Google populated City/State/ZIP asynchronously.
    for (let i = 0; i < 25; i++) {
      if (addressFieldsPopulated(office, street)) return true;
      await sleep(100);
    }

    setStatus(`Needs review: Google address suggestion did not apply for ${office.city || office.address}`);
    return false;
  };

  const findVisitQuestionScope = () => {
    const questionText = "Is this a location that customers can visit, like a store or an office?";
    const question = exactText(questionText);
    if (!question) return null;

    // Always bind to the VISIBLE radiogroup next to the visible question. Google
    // can leave stale/hidden component trees in the DOM after rerenders. Clicking
    // one of those hidden radios changes nothing on screen.
    let node = question.parentElement;
    for (let i = 0; i < 10 && node; i++, node = node.parentElement) {
      const groups = Array.from(node.querySelectorAll?.('[role="radiogroup"]') || [])
        .filter(group => visible(group) && norm(group.textContent).includes("yes") && norm(group.textContent).includes("no"));
      if (groups.length) return groups[0];
      if (node.getAttribute?.("role") === "radiogroup" && visible(node)) return node;
    }

    return Array.from(document.querySelectorAll('[role="radiogroup"]'))
      .find(group => visible(group) && norm(group.textContent).includes("yes") && norm(group.textContent).includes("no")) || null;
  };

  const findVisitOption = labelText => {
    const group = findVisitQuestionScope();
    if (!group) return null;
    const wanted = norm(labelText);

    const labels = Array.from(group.querySelectorAll("label")).filter(visible);
    const label = labels.find(el => norm(el.textContent) === wanted)
      || Array.from(group.querySelectorAll("span,div")).find(el => visible(el) && norm(el.textContent) === wanted);
    if (!label) return null;

    // Do NOT depend on Google's minified jsaction/controller names. Bind only to
    // visible semantic radios; stale hidden radios are ignored.
    const radios = Array.from(group.querySelectorAll('[role="radio"]')).filter(visible);
    let control = null;

    const nested = Array.from(label.querySelectorAll?.('[role="radio"]') || []).find(visible);
    if (nested) control = nested;

    if (!control && wanted === 'yes') {
      control = radios.find(el => el.getAttribute('data-value') === 'storefront')
        || radios.find(el => el.getAttribute('aria-posinset') === '1');
    } else if (!control && wanted === 'no') {
      control = radios.find(el => el.getAttribute('aria-posinset') === '2');
    }

    // Geometry fallback: choose the visible radio whose vertical center is closest
    // to the exact visible label.
    if (!control && radios.length) {
      const lr = label.getBoundingClientRect();
      const cy = lr.top + lr.height / 2;
      radios.sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return Math.abs((ar.top + ar.height / 2) - cy) - Math.abs((br.top + br.height / 2) - cy);
      });
      control = radios[0] || null;
    }

    const decorative = control?.querySelector?.('.SCWude,.t5nRo,.wEIpqb')
      || Array.from(label.querySelectorAll?.('span,div') || [])
        .filter(el => visible(el))
        .sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          const aScore = (ar.width <= 36 && ar.height <= 36 ? 0 : 10000) + ar.width * ar.height;
          const bScore = (br.width <= 36 && br.height <= 36 ? 0 : 10000) + br.width * br.height;
          return aScore - bScore;
        })[0] || null;

    return { group, label, control, decorative };
  };

  const visitControlSelected = binding => {
    if (!binding) return false;
    const radio = binding.control;
    if (radio) {
      if (radio.tagName === 'INPUT' && typeof radio.checked === 'boolean' && radio.checked) return true;
      if (radio.getAttribute?.('aria-checked') === 'true') return true;
      if (radio.getAttribute?.('aria-selected') === 'true') return true;
      const cls = String(radio.className || '');
      if (/\bN2RpBe\b|checked|selected/i.test(cls)) return true;
    }
    return false;
  };

  const visitOptionSelected = labelText => {
    const binding = findVisitOption(labelText);
    return !!binding && visitControlSelected(binding);
  };

  const pointerMouseSequenceAt = async (target, x, y) => {
    if (!target) return false;
    const common = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      button: 0,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y
    };
    try {
      target.dispatchEvent(new PointerEvent('pointerover', { ...common, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 0 }));
      target.dispatchEvent(new PointerEvent('pointermove', { ...common, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 0 }));
      target.dispatchEvent(new PointerEvent('pointerdown', { ...common, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 1 }));
    } catch (_) {}
    mouseEventAt('mouseover', target, x, y, 0);
    mouseEventAt('mousemove', target, x, y, 0);
    mouseEventAt('mousedown', target, x, y, 1);
    try {
      target.dispatchEvent(new PointerEvent('pointerup', { ...common, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 0 }));
    } catch (_) {}
    mouseEventAt('mouseup', target, x, y, 0);
    mouseEventAt('click', target, x, y, 0);
    await sleep(120);
    return true;
  };

  const verifyVisitYes = async () => {
    for (let i = 0; i < 15; i++) {
      if (visitOptionSelected('Yes')) return true;
      await sleep(70);
    }
    return false;
  };

  const forceVisitDomStateYes = () => {
    const yes = findVisitOption('Yes');
    const no = findVisitOption('No');
    if (!yes?.control) return false;

    // This mirrors the exact DOM delta observed after a real manual Yes click:
    //   aria-checked: false -> true
    //   classes added: i9xfbb N2RpBe
    // and the reverse for No. This is only a LAST fallback after interaction paths.
    try {
      yes.control.setAttribute('aria-checked', 'true');
      yes.control.classList.add('i9xfbb', 'N2RpBe');
      yes.control.setAttribute('tabindex', '0');

      if (no?.control) {
        no.control.setAttribute('aria-checked', 'false');
        no.control.classList.remove('i9xfbb', 'N2RpBe');
      }

      for (const target of [yes.control, yes.label, yes.group]) {
        if (!target) continue;
        try { target.dispatchEvent(new Event('input', { bubbles: true, composed: true })); } catch (_) {}
        try { target.dispatchEvent(new Event('change', { bubbles: true, composed: true })); } catch (_) {}
      }
      return visitOptionSelected('Yes');
    } catch (_) {
      return false;
    }
  };

  const ensureCustomerVisitYes = async () => {
    if (visitOptionSelected('Yes')) return true;

    let yes = findVisitOption('Yes');
    let no = findVisitOption('No');
    if (!yes?.control) return false;

    const yesRadio = yes.control;
    const group = yes.group;

    // 1) Exact visible LABEL first. Manual clicking the label works in the UI, so
    // reproduce that target before touching Google's internal radio div.
    try { yes.label?.click(); } catch (_) {}
    if (await verifyVisitYes()) return true;

    // 2) Exact visible semantic radio.
    try { yesRadio.focus(); } catch (_) {}
    try { yesRadio.click(); } catch (_) {}
    if (await verifyVisitYes()) return true;

    // 3) Click the actual visible radio circle / left edge of the Yes label.
    yes = findVisitOption('Yes');
    if (yes?.label) {
      const lr = yes.label.getBoundingClientRect();
      const x = lr.left + Math.min(9, Math.max(5, lr.height / 2));
      const y = lr.top + lr.height / 2;
      const hit = document.elementFromPoint(x, y) || yes.control || yes.label;
      await pointerMouseSequenceAt(hit, x, y);
      if (await verifyVisitYes()) return true;
    }

    // 4) Keyboard transition from the currently selected No radio to Yes.
    no = findVisitOption('No');
    if (no?.control && visitControlSelected(no)) {
      try { no.control.focus(); } catch (_) {}
      dispatchLegacyKeyboardEvent(no.control, 'keydown', 'ArrowUp', 'ArrowUp');
      dispatchLegacyKeyboardEvent(no.control, 'keyup', 'ArrowUp', 'ArrowUp');
      if (await verifyVisitYes()) return true;

      try { group.focus?.(); } catch (_) {}
      dispatchLegacyKeyboardEvent(group, 'keydown', 'ArrowUp', 'ArrowUp');
      dispatchLegacyKeyboardEvent(group, 'keyup', 'ArrowUp', 'ArrowUp');
      if (await verifyVisitYes()) return true;
    }

    // 5) Standard ARIA-radio Space activation with legacy keyCode/which included.
    yes = findVisitOption('Yes');
    if (yes?.control) {
      try { yes.control.focus(); } catch (_) {}
      dispatchLegacyKeyboardEvent(yes.control, 'keydown', ' ', 'Space');
      dispatchLegacyKeyboardEvent(yes.control, 'keypress', ' ', 'Space');
      dispatchLegacyKeyboardEvent(yes.control, 'keyup', ' ', 'Space');
      if (await verifyVisitYes()) return true;
    }

    // 6) Last-resort state mirror. The manual-selection screenshot proves these are
    // the exact selected-state attributes/classes used by this Google control.
    if (forceVisitDomStateYes()) {
      await sleep(100);
      if (visitOptionSelected('Yes')) return true;
    }

    return false;
  };

  const handleBusinessDetails = async () => {
    const s = state();
    const market = MARKETS[s.market];

    // Google sometimes shows a blocking onboarding modal immediately after navigation.
    if (exactText("Get more customers")) {
      if (!(await closeGetMoreCustomersPopup())) throw new Error("Could not close Get more customers popup");
      await sleep(200);
    }

    setStatus("Business details: filling fields");

    if (!(await setLabeledInput("Business name", "Martine Law, PLLC"))) throw new Error("Business name field failed");
    if (!(await setBusinessPhone(s.phone))) throw new Error("Business phone field failed");
    if (!(await setLabeledInput("Owner's first name", market.owner.first))) throw new Error("Owner first name failed");
    if (!(await setLabeledInput("Owner's last name", market.owner.last))) throw new Error("Owner last name failed");
    if (!(await setLabeledInput("Total number of professionals", "20"))) throw new Error("Professionals field failed");
    if (!(await setLabeledInput("Year founded", "2019"))) throw new Error("Year founded field failed");

    setStatus("Business details: selecting languages");
    const languagesOk = await configureBusinessLanguages();

    // Continue filling the rest of Business Details even if a language needs review.
    // This prevents Address and Yes from being left blank just because the language selector is difficult.
    setStatus("Business details: address");
    if (!(await fillAddress(s, market))) throw new Error("Address field failed");

    setStatus("Business details: setting office location to Yes");
    if (!(await ensureCustomerVisitYes())) throw new Error("Could not set customer-visit location to Yes");

    if (!languagesOk) throw new Error("Languages are not 3/3");

    const next = buttonByText("Next");
    if (!next) throw new Error("Next button not found on Business Details");
    setStatus("Business details complete — continuing");
    await clickEl(next);
  };

  /* ----------------------------- Service area ----------------------------- */

  /*
     SERVICE AREA ENGINE v1.0.16

     This intentionally returns to the structure of the ORIGINAL working
     console script.

     The important difference from v1.0.15 is that we DO NOT require the
     underlying <input> to have placeholder="Search for areas" or an
     aria-label containing that text. Google can render the visible placeholder
     in a separate element while the real input itself has neither attribute.

     We instead:
       1) find the visible Include/Exclude heading,
       2) walk upward until that section contains a visible native text input,
       3) type into that input with the native value setter,
       4) wait for a real matching autocomplete result,
       5) click the result,
       6) re-find the section and verify the area was rendered,
       7) repeat.

     The Tampermonkey header also explicitly uses @sandbox raw so this runs in
     the page MAIN_WORLD, matching DevTools console behavior as closely as
     Tampermonkey allows.
  */

  const serviceAreaHeading = kind =>
    exactText(kind === "include" ? "Include these service areas" : "Exclude these service areas");

  const serviceAreaNativeInputsIn = root => {
    if (!root?.querySelectorAll) return [];
    return Array.from(root.querySelectorAll('input,textarea'))
      .filter(el => {
        if (!visible(el) || el.disabled) return false;
        if (el.tagName === 'INPUT') {
          const type = norm(el.getAttribute('type') || 'text');
          if (['hidden','checkbox','radio','button','submit','reset'].includes(type)) return false;
        }
        return true;
      });
  };

  // This is intentionally modeled on the old working console script:
  // start at the heading and walk upward until a visible input is found.
  const findServiceAreaSection = kind => {
    const heading = serviceAreaHeading(kind);
    if (!heading) return null;

    let node = heading;
    for (let depth = 0; depth < 10 && node; depth++, node = node.parentElement) {
      const inputs = serviceAreaNativeInputsIn(node);
      if (inputs.length) return node;
    }

    return heading.parentElement || null;
  };

  const findServiceAreaInput = kind => {
    const heading = serviceAreaHeading(kind);
    const section = findServiceAreaSection(kind);

    if (section) {
      const inputs = serviceAreaNativeInputsIn(section);
      if (inputs.length === 1) return inputs[0];

      // If the discovered ancestor contains more than one field, choose the
      // visible native text field closest to and below the requested heading.
      if (inputs.length > 1 && heading) {
        const hr = heading.getBoundingClientRect();
        inputs.sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          const ad = Math.abs(ar.top - hr.bottom) + Math.abs(ar.left - hr.left) * 0.1;
          const bd = Math.abs(br.top - hr.bottom) + Math.abs(br.left - hr.left) * 0.1;
          return ad - bd;
        });
        return inputs[0] || null;
      }
    }

    // Geometry fallback. This still does NOT depend on placeholder/aria-label.
    if (heading) {
      const hr = heading.getBoundingClientRect();
      const candidates = Array.from(document.querySelectorAll('input,textarea'))
        .filter(el => {
          if (!visible(el) || el.disabled) return false;
          const r = el.getBoundingClientRect();
          const below = r.top >= hr.top - 10 && r.top <= hr.bottom + 150;
          const horizontal = r.right >= hr.left - 80 && r.left <= hr.right + 350;
          return below && horizontal && r.width >= 100 && r.height >= 20;
        });
      candidates.sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return Math.abs(ar.top - hr.bottom) - Math.abs(br.top - hr.bottom);
      });
      if (candidates[0]) return candidates[0];
    }

    return null;
  };

  const waitForServiceAreaInput = async (kind, timeout = 15000) => {
    let elapsed = 0;
    while (elapsed < timeout) {
      assertPage("service-area");
      await waitUntilVisible();
      assertPage("service-area");
      const input = findServiceAreaInput(kind);
      if (input) return input;
      await sleepOnPage(100, "service-area");
      elapsed += 100;
    }
    assertPage("service-area");
    return findServiceAreaInput(kind);
  };

  // Service-area names are not rendered consistently by Google.
  // Example: our config may say "St. Paul, MN" while Google's autocomplete
  // renders "St Paul, MN" (no period), and some surfaces may use "Saint Paul".
  // Canonicalize those variants before matching.
  const geoNorm = text => norm(text)
    .replace(/[.,]/g, ' ')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\s+/g, ' ')
    .trim();

  const corePlace = term => geoNorm(term)
    .replace(/\s+(nc|mn|nj|tx)$/i, '')
    .replace(/\s+(north carolina|minnesota|new jersey|texas)$/i, '')
    .trim();

  const stateSuffixForServiceArea = () => {
    const market = MARKETS[state().market];
    const st = norm(market?.state || '');
    if (st === 'north carolina') return 'NC';
    if (st === 'minnesota') return 'MN';
    if (st === 'new jersey') return 'NJ';
    if (st === 'texas') return 'TX';
    return '';
  };

  const sectionHasServiceArea = (kind, term) => {
    const section = findServiceAreaSection(kind);
    if (!section) return false;
    const core = corePlace(term);
    if (!core) return false;
    const text = geoNorm(section.innerText || section.textContent || '');
    return text.includes(core);
  };

  const serviceAreaAutocompleteRows = (term, input) => {
    const core = corePlace(term);
    if (!core) return [];
    const ir = input?.getBoundingClientRect?.();

    // This selector is deliberately close to the original console script.
    const candidates = Array.from(document.querySelectorAll(
      '[role="option"],[role="menuitem"],[role="menuitemradio"],[role="menuitemcheckbox"],li,[jsaction]'
    )).filter(el => {
      if (!visible(el)) return false;
      const text = geoNorm(el.textContent || '');
      if (!text.includes(core)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 12 || r.height > 180) return false;
      if (!ir) return true;
      // Prefer the overlay around/below the active input but allow portalled UI.
      return r.top >= ir.top - 120 && r.top <= ir.bottom + 650;
    });

    const uniq = [];
    const seen = new Set();
    for (const el of candidates) {
      const target = el.closest?.(
        '[role="option"],[role="menuitem"],[role="menuitemradio"],[role="menuitemcheckbox"],[jsaction]'
      ) || rowLikeAncestor(el) || el;
      if (!target || seen.has(target) || !visible(target)) continue;
      seen.add(target);
      uniq.push(target);
    }

    uniq.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const aRole = norm(a.getAttribute?.('role'));
      const bRole = norm(b.getAttribute?.('role'));
      const roleScore = role => role === 'option' ? 0 : role.startsWith('menuitem') ? 1 : 2;
      const rs = roleScore(aRole) - roleScore(bRole);
      if (rs) return rs;
      if (ir) return Math.abs(ar.top - ir.bottom) - Math.abs(br.top - ir.bottom);
      return ar.top - br.top;
    });

    return uniq;
  };

  const waitForServiceAreaChoice = async (kind, term, input, timeout = 7000) => {
    let elapsed = 0;
    while (elapsed < timeout) {
      assertPage("service-area");
      await waitUntilVisible();
      assertPage("service-area");
      const freshInput = findServiceAreaInput(kind) || input;
      const rows = serviceAreaAutocompleteRows(term, freshInput);
      if (rows.length) return rows[0];
      await sleepOnPage(100, "service-area");
      elapsed += 100;
    }
    assertPage("service-area");
    return null;
  };

  const typeServiceArea = async (input, value) => {
    assertPage("service-area");
    if (!input || !input.isConnected) return false;
    try { input.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (_) {}
    try { input.focus(); } catch (_) {}

    nativeSet(input, '');
    await sleepOnPage(60, "service-area");
    if (!input.isConnected) return false;
    nativeSet(input, value);

    // Match real typing a little more closely without relying on generated
    // Google controller names.
    try {
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: value.slice(-1) || 'a', bubbles: true, cancelable: true
      }));
      input.dispatchEvent(new KeyboardEvent('keyup', {
        key: value.slice(-1) || 'a', bubbles: true, cancelable: true
      }));
    } catch (_) {}
    return true;
  };

  const waitForServiceAreaAccepted = async (kind, term, timeout = 4500) => {
    let elapsed = 0;
    while (elapsed < timeout) {
      assertPage("service-area");
      await waitUntilVisible();
      assertPage("service-area");
      if (sectionHasServiceArea(kind, term)) return true;
      await sleepOnPage(100, "service-area");
      elapsed += 100;
    }
    assertPage("service-area");
    return sectionHasServiceArea(kind, term);
  };

  const clickServiceAreaChoice = async (kind, term, row) => {
    assertPage("service-area");
    if (!row || !row.isConnected) return false;
    try { row.scrollIntoView({ block: 'nearest', behavior: 'auto' }); } catch (_) {}

    // Primary path: exactly what the older console script did.
    await clickEl(rowLikeAncestor(row));
    if (await waitForServiceAreaAccepted(kind, term, 2200)) return true;

    // Fallback only if Google showed the real row but ignored the first click.
    const input = findServiceAreaInput(kind);
    const fresh = serviceAreaAutocompleteRows(term, input)[0];
    if (fresh) {
      await fullGoogleClick(fresh);
      if (await waitForServiceAreaAccepted(kind, term, 2200)) return true;
    }

    return false;
  };

  const addServiceAreaOldConsoleStyle = async (kind, term) => {
    assertPage("service-area");
    await waitUntilVisible();
    assertPage("service-area");
    if (sectionHasServiceArea(kind, term)) return true;

    const suffix = stateSuffixForServiceArea();
    const queries = [term];
    if (suffix && !new RegExp(',\\s*' + suffix + '$', 'i').test(term)) {
      queries.push(`${term}, ${suffix}`);
    }

    for (let attempt = 0; attempt < 4; attempt++) {
      assertPage("service-area");
      await waitUntilVisible();
      assertPage("service-area");
      if (sectionHasServiceArea(kind, term)) return true;

      const input = await waitForServiceAreaInput(kind, 7000);
      if (!input) {
        console.warn(`[LSA MASTER] ${kind} native input not found for ${term}`);
        continue;
      }

      const query = queries[attempt % queries.length];
      console.log(`[LSA MASTER] ${kind} ${attempt + 1}/4: typing ${query}`);
      await typeServiceArea(input, query);

      const choice = await waitForServiceAreaChoice(kind, term, input, attempt < 2 ? 6500 : 9000);
      if (!choice) {
        console.warn(`[LSA MASTER] no autocomplete choice for ${query}`);
        try { input.blur(); } catch (_) {}
        await sleep(250);
        continue;
      }

      console.log(`[LSA MASTER] autocomplete found for ${term}:`, norm(choice.textContent || ''));
      if (await clickServiceAreaChoice(kind, term, choice)) return true;

      console.warn(`[LSA MASTER] Google showed ${term} but did not accept click; retrying`);
      try { input.blur(); } catch (_) {}
      await sleep(300);
    }

    return sectionHasServiceArea(kind, term);
  };

  const logServiceAreaDiagnostics = () => {
    try {
      const visibleInputs = Array.from(document.querySelectorAll('input,textarea'))
        .filter(visible)
        .map((el, i) => ({
          i,
          tag: el.tagName,
          type: el.getAttribute('type'),
          placeholder: el.getAttribute('placeholder'),
          ariaLabel: el.getAttribute('aria-label'),
          value: el.value
        }));
      console.log('[LSA MASTER] visible native text controls on Service Area page:', visibleInputs);
      console.log('[LSA MASTER] include heading:', serviceAreaHeading('include'));
      console.log('[LSA MASTER] include input:', findServiceAreaInput('include'));
      console.log('[LSA MASTER] exclude heading:', serviceAreaHeading('exclude'));
      console.log('[LSA MASTER] exclude input:', findServiceAreaInput('exclude'));
    } catch (e) {
      console.warn('[LSA MASTER] service-area diagnostic failed', e);
    }
  };


  // Service Area duplicate cleanup v1.0.27
  const cleanupServiceAreaDuplicates = async () => {
    assertPage("service-area");
    for (let attempt = 0; attempt < 8; attempt++) {
      assertPage("service-area");
      const duplicateText = Array.from(document.querySelectorAll('*')).find(el => {
        if (!visible(el)) return false;
        const t = norm(el.textContent || '');
        return t.includes('duplicate areas') && t.length < 200;
      });

      const buttons = Array.from(document.querySelectorAll('button,[role="button"],div,span'))
        .filter(el => visible(el) && norm(el.textContent || '') === 'delete duplicates');

      if (!duplicateText && !buttons.length) return true;

      const btn = buttons[0];
      if (btn) {
        console.log('[LSA MASTER] Duplicate areas detected. Clicking Delete duplicates');
        await fullGoogleClick(btn.closest('[role="button"],button') || btn);
        await sleepOnPage(1500, 'service-area');
      } else {
        await sleepOnPage(500, 'service-area');
      }
    }

    return true;
  };

  const handleServiceArea = async () => {
    assertPage("service-area");
    const s = state();
    const market = MARKETS[s.market];

    logServiceAreaDiagnostics();

    // Old-console-style readiness: heading + any visible native input in that
    // structural section. No placeholder/aria-label requirement.
    const includeInput = await waitForServiceAreaInput('include', 15000);
    if (!includeInput) throw new Error('Include service-area input not found by old-console structural search');

    setStatus(`Service area: adding ${market.include.length} included areas`);
    for (let i = 0; i < market.include.length; i++) {
      assertPage("service-area");
      const term = market.include[i];
      setStatus(`Service area include ${i + 1}/${market.include.length}: ${term}`);

      if (!(await addServiceAreaOldConsoleStyle('include', term))) {
        setStatus(`Service area needs review: ${term}`);
        throw new Error(`Could not add included service area: ${term}`);
      }
      await sleepOnPage(150, "service-area");
    }

    assertPage("service-area");
    if (market.exclude.length) {
      const excludeInput = await waitForServiceAreaInput('exclude', 10000);
      if (!excludeInput) throw new Error('Exclude service-area input not found by old-console structural search');

      for (let i = 0; i < market.exclude.length; i++) {
        assertPage("service-area");
        const term = market.exclude[i];
        setStatus(`Service area exclude ${i + 1}/${market.exclude.length}: ${term}`);

        if (!(await addServiceAreaOldConsoleStyle('exclude', term))) {
          setStatus(`Excluded area needs review: ${term}`);
          throw new Error(`Could not add excluded service area: ${term}`);
        }
        await sleepOnPage(150, "service-area");
      }
    }

    // Google can create duplicate chips when an area was previously added.
    // Clean them before leaving Service Area.
    await cleanupServiceAreaDuplicates();

    assertPage("service-area");
    const next = buttonByText('Next');
    if (!next) throw new Error('Next button not found on Service Area');
    setStatus('Service area complete — continuing');
    await clickEl(next);
    await waitForPageExit("service-area", 7000);
  };

  /* ----------------------------- Service types ----------------------------- */

  const findTab = name => {
    const text = exactText(name);
    if (!text) return null;
    return text.closest('[role="tab"],button,a,[role="button"]') || text;
  };

  const bindingForService = name => {
    const text = exactText(name);
    if (!text || norm(text.textContent) === "i agree") return null;
    if (text.tagName === "LABEL") {
      const f = text.getAttribute("for");
      if (f) {
        const control = document.getElementById(f);
        if (control) return { text, control, clickTarget: text };
      }
    }
    let node = text;
    for (let i = 0; i < 8 && node; i++, node = node.parentElement) {
      const controls = Array.from(node.querySelectorAll?.('input[type="checkbox"],[role="checkbox"],[aria-checked]') || []);
      if (controls.length === 1) return { text, control: controls[0], clickTarget: node };
    }
    return null;
  };

  const currentVisibleServices = () => {
    const found = [];
    const seen = new Set();
    for (const label of KNOWN_SERVICE_LABELS) {
      const b = bindingForService(label);
      if (b && visible(b.text) && !seen.has(b.control)) {
        seen.add(b.control);
        found.push({ name: label, ...b });
      }
    }
    return found;
  };

  const setCheckboxBinding = async (b, desired) => {
    assertPage("service-types");
    const now = checked(b.control);
    if (now === desired) return true;
    try { b.control.click(); } catch (_) { await clickEl(b.clickTarget); }
    await sleepOnPage(80, "service-types");
    return checked(b.control) === desired;
  };

  const serviceNameMatches = (actual, wanted) => {
    const a = norm(actual).replace(/\bduis\b/g, "dui").replace(/\s*&\s*/g, " and ");
    const w = norm(wanted).replace(/\bduis\b/g, "dui").replace(/\s*&\s*/g, " and ");
    return a === w || (a.includes("dui") && w.includes("dui") && a.includes("reckless driving") && w.includes("reckless driving"));
  };

  const configureServiceTab = async (tabName, cfg) => {
    assertPage("service-types");
    const tab = findTab(tabName);
    if (!tab) {
      if (cfg.optional) return true;
      throw new Error(`${tabName} tab not found`);
    }
    await clickEl(tab);
    await sleepOnPage(250, "service-types");
    const services = currentVisibleServices();
    if (!services.length) throw new Error(`No services detected for ${tabName}`);

    for (const service of services) {
      assertPage("service-types");
      let desired = false;
      if (cfg.mode === "all-except") desired = !cfg.exclude.some(x => serviceNameMatches(service.name, x));
      else desired = cfg.wanted.some(x => serviceNameMatches(service.name, x));
      if (!(await setCheckboxBinding(service, desired))) throw new Error(`Could not set ${service.name} on ${tabName}`);
    }
    return true;
  };

  const licenseAgreementBinding = () => {
    const text = exactText("I agree");
    if (!text) return null;

    const label = text.tagName === "LABEL" ? text : text.closest("label");

    // First prefer a real/native or ARIA checkbox associated with the label row.
    let node = label || text;
    for (let i = 0; i < 8 && node; i++, node = node.parentElement) {
      const controls = Array.from(
        node.querySelectorAll?.('input[type="checkbox"],[role="checkbox"],[aria-checked]') || []
      ).filter(visible);
      if (controls.length === 1) {
        return { text, label: label || text, control: controls[0], clickTarget: node };
      }
    }

    // Google sometimes renders the visual checkbox as a sibling just to the left
    // of the text rather than inside the label. Match it geometrically.
    const tr = text.getBoundingClientRect();
    const controls = Array.from(
      document.querySelectorAll('input[type="checkbox"],[role="checkbox"],[aria-checked]')
    ).filter(el => {
      if (!visible(el)) return false;
      const r = el.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      const ty = tr.top + tr.height / 2;
      return Math.abs(cy - ty) <= 24 && r.right <= tr.left + 12 && r.right >= tr.left - 80;
    });

    if (controls.length) {
      controls.sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return Math.abs(ar.right - tr.left) - Math.abs(br.right - tr.left);
      });
      return { text, label: label || text, control: controls[0], clickTarget: label || text };
    }

    return { text, label: label || text, control: null, clickTarget: label || text };
  };

  const licenseAgreementChecked = binding => {
    const b = binding || licenseAgreementBinding();
    if (!b) return false;
    if (b.control) return checked(b.control);

    // Last-resort visual/DOM checks for Google's custom checkbox wrappers.
    const row = b.label?.parentElement || b.text?.parentElement;
    if (!row) return false;
    const aria = row.querySelector?.('[aria-checked="true"]');
    if (aria) return true;
    const native = row.querySelector?.('input[type="checkbox"]');
    if (native && native.checked) return true;
    return false;
  };

  const ensureLicenseAgreement = async () => {
    assertPage("service-types");
    let binding = licenseAgreementBinding();
    if (!binding) throw new Error('Professional license verification "I agree" control not found');
    if (licenseAgreementChecked(binding)) return true;

    setStatus('Service types: checking professional license verification');

    const tryAndVerify = async target => {
      if (!target) return false;
      await fullGoogleClick(target);
      for (let i = 0; i < 10; i++) {
        await sleepOnPage(70, "service-types");
        binding = licenseAgreementBinding();
        if (licenseAgreementChecked(binding)) return true;
      }
      return false;
    };

    // Try the actual checkbox first, then the label/text/wrapper.
    if (await tryAndVerify(binding.control)) return true;
    if (await tryAndVerify(binding.label)) return true;
    if (await tryAndVerify(binding.text)) return true;
    if (await tryAndVerify(binding.clickTarget)) return true;

    // Coordinate fallback: click the visible square immediately left of "I agree".
    const tr = binding.text.getBoundingClientRect();
    for (const x of [tr.left - 18, tr.left - 24, tr.left - 30]) {
      const y = tr.top + tr.height / 2;
      const target = document.elementFromPoint(x, y);
      if (target && await tryAndVerify(target)) return true;
    }

    throw new Error('Could not check Professional license verification "I agree"');
  };

  const waitForServiceTypesNavigation = async (timeout = 7000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      await sleep(120);
      if (detectPage() !== "service-types") return true;
    }
    return false;
  };

  const handleServiceTypes = async () => {
    assertPage("service-types");
    let s = state();

    // Configure the service tabs only ONCE for this automation run.
    // This flag is persisted in this tab's sessionStorage, so the 1-second master cycle
    // cannot bounce through Criminal/DUI/Traffic/Family again after they are done.
    if (!s.serviceTypesConfigured) {
      setStatus("Service types: configuring tabs");
      for (const [tabName, cfg] of Object.entries(SERVICE_TYPES)) {
        assertPage("service-types");
        setStatus(`Service types: ${tabName}`);
        await configureServiceTab(tabName, cfg);
      }

      patchState({
        serviceTypesConfigured: true,
        serviceTypesWaitingForAgreement: false,
        serviceTypesConfiguredAt: Date.now()
      });
      s = state();
      setStatus("Service types complete — tabs will not be changed again");
    }

    // Once tabs are complete, never touch them again.
    // If I agree is already checked (including a manual click), continue.
    let agreement = licenseAgreementBinding();
    if (!licenseAgreementChecked(agreement)) {
      // Try automatic agreement only once. If Google rejects it, switch to a
      // manual-hold state. Future cycles only watch the checkbox; they do not
      // revisit the service tabs or repeatedly click the agreement.
      if (!s.serviceTypesWaitingForAgreement) {
        try {
          await ensureLicenseAgreement();
        } catch (err) {
          console.warn("[LSA MASTER] Automatic I agree selection failed; waiting for manual selection.", err);
          patchState({ serviceTypesWaitingForAgreement: true });
          setStatus('Service types complete — please check "I agree" manually');
          return;
        }
      } else {
        setStatus('Service types complete — waiting for manual "I agree"');
        return;
      }
    }

    // Re-read after the auto attempt or a manual click.
    agreement = licenseAgreementBinding();
    if (!licenseAgreementChecked(agreement)) {
      patchState({ serviceTypesWaitingForAgreement: true });
      setStatus('Service types complete — waiting for manual "I agree"');
      return;
    }

    // Agreement is now checked. Clear the hold and advance once.
    patchState({ serviceTypesWaitingForAgreement: false });

    let next = buttonByText("Next");
    if (!next) {
      setStatus('Service types complete — "I agree" checked; waiting for Next');
      return;
    }

    for (let i = 0; i < 20; i++) {
      const disabled = next.disabled || next.getAttribute("aria-disabled") === "true";
      if (!disabled) break;
      await sleepOnPage(100, "service-types");
      next = buttonByText("Next") || next;
    }

    const disabled = next.disabled || next.getAttribute("aria-disabled") === "true";
    if (disabled) {
      setStatus('Service types complete — "I agree" checked; Next still disabled');
      return;
    }

    setStatus("Service types complete — continuing");
    await fullGoogleClick(next);

    // Stay inside this handler until Google actually changes screens.
    if (!(await waitForServiceTypesNavigation())) {
      setStatus("Service types complete — waiting for Google to continue");
      return;
    }
  };

  /* ----------------------------- Business hours ----------------------------- */

  // v1.0.22: identify each weekday by its own vertical DOM band.
  // The prior version sometimes climbed to a container holding ALL seven days,
  // so Tuesday-Sunday accidentally reused Monday's unchecked box / 24-hour value.
  // This implementation never uses a shared ancestor as the source of truth.

  const BUSINESS_DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const hoursText = el => String(el?.innerText || el?.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  const centerY = el => {
    const r = el?.getBoundingClientRect?.();
    return r ? r.top + r.height / 2 : NaN;
  };

  const businessDayLabel = day => {
    const wanted = norm(day);
    const matches = Array.from(document.querySelectorAll("span,div,label,p"))
      .filter(el => visible(el) && norm(el.textContent) === wanted);
    matches.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    });
    return matches[0] || null;
  };

  const businessDayBand = day => {
    const index = BUSINESS_DAYS.indexOf(day);
    const label = businessDayLabel(day);
    if (!label) return null;
    const lr = label.getBoundingClientRect();

    let bottom = lr.top + 82;
    if (index >= 0 && index < BUSINESS_DAYS.length - 1) {
      const next = businessDayLabel(BUSINESS_DAYS[index + 1]);
      if (next) bottom = next.getBoundingClientRect().top - 3;
    } else {
      // Sunday: stop before Back/Next when possible.
      const nextButton = buttonByText("Next");
      if (nextButton) bottom = Math.min(bottom, nextButton.getBoundingClientRect().top - 6);
    }

    return {
      label,
      top: lr.top - 4,
      bottom: Math.max(lr.bottom + 30, bottom),
      left: lr.left
    };
  };

  const inDayBand = (el, band, pad = 0) => {
    if (!el || !band || !visible(el)) return false;
    const r = el.getBoundingClientRect();
    const y = r.top + r.height / 2;
    return y >= band.top - pad && y < band.bottom + pad;
  };

  const closestByGeometry = (elements, target) => {
    if (!elements.length || !target) return null;
    const tr = target.getBoundingClientRect();
    const tx = tr.left + tr.width / 2;
    const ty = tr.top + tr.height / 2;
    return elements.slice().sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const ad = Math.abs((ar.top + ar.height / 2) - ty) * 4 + Math.abs((ar.left + ar.width / 2) - tx);
      const bd = Math.abs((br.top + br.height / 2) - ty) * 4 + Math.abs((br.left + br.width / 2) - tx);
      return ad - bd;
    })[0] || null;
  };

  const closedBindingForBusinessDay = day => {
    const band = businessDayBand(day);
    if (!band) return null;

    const closedLabels = allExactText("Closed").filter(el => inDayBand(el, band, 6));
    const closedLabel = closedLabels.sort((a, b) => Math.abs(centerY(a) - centerY(band.label)) - Math.abs(centerY(b) - centerY(band.label)))[0] || null;

    // First try a tight DOM association around this day's own Closed label.
    if (closedLabel) {
      let node = closedLabel;
      for (let depth = 0; depth < 5 && node; depth++, node = node.parentElement) {
        const controls = Array.from(node.querySelectorAll?.('input[type="checkbox"],[role="checkbox"]') || [])
          .filter(el => inDayBand(el, band, 8));
        if (controls.length === 1) return { band, label: closedLabel, control: controls[0] };
      }
    }

    // Geometry fallback: choose the checkbox in this weekday's vertical band,
    // never the first checkbox from the whole Business Hours container.
    const controls = Array.from(document.querySelectorAll('input[type="checkbox"],[role="checkbox"]'))
      .filter(el => inDayBand(el, band, 8));
    const control = closedLabel ? closestByGeometry(controls, closedLabel) : controls[0] || null;
    return control ? { band, label: closedLabel, control } : null;
  };

  const businessDayIsClosed = day => {
    const binding = closedBindingForBusinessDay(day);
    return binding?.control ? checked(binding.control) : false;
  };

  const TIME_VALUE_RE = /^(?:24 hours|(?:0?[1-9]|1[0-2]):[0-5][0-9]\s*(?:am|pm))$/i;

  const timeValueElementsForBusinessDay = day => {
    const band = businessDayBand(day);
    if (!band) return [];

    const candidates = Array.from(document.querySelectorAll("span,div,button"))
      .filter(el => inDayBand(el, band, 5) && TIME_VALUE_RE.test(hoursText(el)));

    // Keep only the smallest exact-text node at each physical location.
    const leaves = candidates.filter(el =>
      !candidates.some(other => other !== el && el.contains(other) && hoursText(other) === hoursText(el))
    );

    leaves.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return ar.left - br.left || (ar.width * ar.height) - (br.width * br.height);
    });

    const unique = [];
    for (const el of leaves) {
      const r = el.getBoundingClientRect();
      if (!unique.some(x => {
        const xr = x.getBoundingClientRect();
        return Math.abs(xr.left - r.left) < 4 && Math.abs(xr.top - r.top) < 4;
      })) unique.push(el);
    }
    return unique;
  };

  const clickableTimeControl = (valueEl, day) => {
    if (!valueEl) return null;
    const band = businessDayBand(day);
    let node = valueEl;
    let best = valueEl;
    for (let depth = 0; depth < 7 && node; depth++, node = node.parentElement) {
      if (!inDayBand(node, band, 8)) continue;
      const r = node.getBoundingClientRect();
      if (r.width >= 55 && r.width <= 240 && r.height >= 24 && r.height <= 78) best = node;
      if (node.matches?.('select,[role="combobox"],[role="button"],[aria-haspopup],[aria-expanded]') || node.hasAttribute?.("jsaction")) {
        return node;
      }
    }
    return best;
  };

  const opensAtValueForDay = day => {
    const band = businessDayBand(day);
    if (!band) return null;

    const native = Array.from(document.querySelectorAll("select"))
      .filter(el => inDayBand(el, band, 5));
    if (native.length) {
      native.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      const select = native[0];
      return {
        band,
        control: select,
        valueText: String(select.options?.[select.selectedIndex]?.text || select.value || "").trim()
      };
    }

    const values = timeValueElementsForBusinessDay(day);
    if (!values.length) return null;
    const valueEl = values[0]; // left-most control in THIS day's band = Opens at
    return {
      band,
      control: clickableTimeControl(valueEl, day),
      valueEl,
      valueText: hoursText(valueEl)
    };
  };

  const currentOpensAtText = day => opensAtValueForDay(day)?.valueText || "";
  const businessDayIs24Hours = day => norm(currentOpensAtText(day)) === "24 hours";

  const visibleHoursMenu = () => {
    const candidates = Array.from(document.querySelectorAll('[role="menu"],[role="listbox"]'))
      .filter(visible);
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    });
    return candidates[0];
  };

  const waitForNew24HoursOption = async (before, control, timeout = 1800) => {
    const started = Date.now();
    const cr = control?.getBoundingClientRect?.();
    while (Date.now() - started < timeout) {
      const menu = visibleHoursMenu();
      if (menu) {
        const exact = allExactText("24 hours", menu).filter(visible);
        if (exact.length) return exact[0];
      }

      const exact = allExactText("24 hours").filter(visible);
      const newlyVisible = exact.filter(el => !before.has(el));
      if (newlyVisible.length) {
        newlyVisible.sort((a, b) => {
          if (!cr) return 0;
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          const ad = Math.abs(ar.left - cr.left) + Math.abs(ar.top - cr.bottom);
          const bd = Math.abs(br.left - cr.left) + Math.abs(br.top - cr.bottom);
          return ad - bd;
        });
        return newlyVisible[0];
      }
      await sleep(50);
    }
    return null;
  };

  const optionClickTarget = option => {
    if (!option) return null;
    let node = option;
    let best = option;
    for (let depth = 0; depth < 6 && node; depth++, node = node.parentElement) {
      if (!visible(node)) continue;
      if (norm(hoursText(node)) === "24 hours") best = node;
      if (node.matches?.('[role="option"],[role="menuitem"],li,button,[tabindex]') || node.hasAttribute?.("jsaction")) return node;
      if (node.matches?.('[role="menu"],[role="listbox"]')) break;
    }
    return best;
  };

  const waitForDayOpened = async (day, timeout = 1800) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (!businessDayIsClosed(day) && opensAtValueForDay(day)?.control) return true;
      await sleep(60);
    }
    return false;
  };

  const waitForDisplayed24Hours = async (day, timeout = 2200) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (businessDayIs24Hours(day)) return true;
      await sleep(60);
    }
    return false;
  };

  const setBusinessDayTo24Hours = async day => {
    // Always reacquire this day's own checkbox because Google rerenders rows.
    let closedBinding = closedBindingForBusinessDay(day);
    if (!closedBinding?.control) {
      console.warn(`[LSA MASTER] ${day}: Closed checkbox not found in its vertical row`);
      return false;
    }

    if (checked(closedBinding.control)) {
      console.log(`[LSA MASTER] ${day}: unchecking Closed`);
      await fullGoogleClick(closedBinding.control);
      if (!(await waitForDayOpened(day))) {
        // Fallback to the visible Closed label for the same row.
        closedBinding = closedBindingForBusinessDay(day);
        if (closedBinding?.label) await fullGoogleClick(closedBinding.label);
        if (!(await waitForDayOpened(day))) {
          console.warn(`[LSA MASTER] ${day}: could not open day`);
          return false;
        }
      }
    }

    if (businessDayIs24Hours(day)) return true;

    for (let attempt = 1; attempt <= 4; attempt++) {
      const binding = opensAtValueForDay(day);
      if (!binding?.control) {
        console.warn(`[LSA MASTER] ${day}: own Opens at control not found (${attempt}/4)`);
        await sleep(120);
        continue;
      }

      console.log(`[LSA MASTER] ${day}: current Opens at = ${binding.valueText || "(unknown)"}`);

      if (binding.control.tagName === "SELECT") {
        if (setNativeSelectOption(binding.control, "24 hours") && await waitForDisplayed24Hours(day)) return true;
        continue;
      }

      const before = new Set(allExactText("24 hours").filter(visible));
      try { binding.control.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" }); } catch (_) {}
      await sleep(30);
      await fullGoogleClick(binding.control);

      let option = await waitForNew24HoursOption(before, binding.control, 1400);
      if (!option) {
        // Some Google builds respond better to a normal DOM click for opening.
        try { binding.control.click(); } catch (_) {}
        option = await waitForNew24HoursOption(before, binding.control, 1000);
      }

      if (!option) {
        console.warn(`[LSA MASTER] ${day}: 24 hours option did not appear (${attempt}/4)`);
        await sleep(120);
        continue;
      }

      const target = optionClickTarget(option);
      console.log(`[LSA MASTER] ${day}: selecting 24 hours from its opened menu`);
      await fullGoogleClick(target || option);
      if (await waitForDisplayed24Hours(day)) return true;

      // Physical click fallback on the option itself.
      if (visible(option)) {
        await physicalClick(option);
        if (await waitForDisplayed24Hours(day, 1500)) return true;
      }

      console.warn(`[LSA MASTER] ${day}: still shows "${currentOpensAtText(day)}" after attempt ${attempt}/4`);
      await sleep(140);
    }

    return false;
  };

  const businessHoursAllConfigured = () => BUSINESS_DAYS.every(day => {
    const closed = businessDayIsClosed(day);
    const value = currentOpensAtText(day);
    return !closed && norm(value) === "24 hours";
  });

  const waitForBusinessHoursNavigation = async (timeout = 7000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (detectPage() !== "business-hours") return true;
      await sleep(120);
    }
    return false;
  };

  const handleBusinessHours = async () => {
    assertPage("business-hours");
    let s = state();

    // Never trust a persisted completion flag unless all seven current rows
    // independently prove they are open and show 24 hours.
    if (s.businessHoursConfigured && !businessHoursAllConfigured()) {
      console.warn("[LSA MASTER] Clearing stale Business Hours completion flag.");
      patchState({ businessHoursConfigured: false, businessHoursConfiguredAt: null });
      s = state();
    }

    if (!businessHoursAllConfigured()) {
      setStatus("Business hours: opening all 7 days and setting each to 24 hours");
      for (let i = 0; i < BUSINESS_DAYS.length; i++) {
        assertPage("business-hours");
        const day = BUSINESS_DAYS[i];
        setStatus(`Business hours ${i + 1}/7: ${day} → 24 hours`);
        if (!(await setBusinessDayTo24Hours(day))) {
          throw new Error(`Could not set ${day} to 24 hours; Closed=${businessDayIsClosed(day)}; Opens at=${currentOpensAtText(day) || "unknown"}`);
        }
        console.log(`[LSA MASTER] ${day}: confirmed Closed=${businessDayIsClosed(day)} / Opens at=${currentOpensAtText(day)}`);
      }
    }

    if (!businessHoursAllConfigured()) {
      const audit = BUSINESS_DAYS.map(day => `${day}: closed=${businessDayIsClosed(day)}, opens=${currentOpensAtText(day) || "?"}`);
      console.warn("[LSA MASTER] Business hours audit:", audit);
      throw new Error("Business hours verification failed; not all seven days are open 24 hours");
    }

    patchState({
      businessHoursConfigured: true,
      businessHoursConfiguredAt: Date.now()
    });

    const next = buttonByText("Next");
    if (!next) throw new Error("Next button not found on Business Hours");
    const disabled = next.disabled || next.getAttribute("aria-disabled") === "true";
    if (disabled) {
      setStatus("Business hours complete — Next is still disabled");
      return;
    }

    setStatus("Business hours complete — continuing to confirmation");
    await fullGoogleClick(next);

    if (!(await waitForBusinessHoursNavigation())) {
      setStatus("Business hours complete — waiting for Google to continue");
    }
  };

  /* ---------------------- Create-account hard manual gate ---------------------- */

  const CREATE_ACCOUNT_GUARD_KEY = "__martine_lsa_create_account_next_guard_v1024__";

  const isCreateAccountScreenNow = () => {
    const t = pageText();
    return t.includes("create an account") && t.includes("continue creating a new account");
  };

  const isCreateAccountNextTarget = target => {
    if (!target || !(target instanceof Element)) return false;
    const clickable = target.closest('button,[role="button"],a,input[type="button"],input[type="submit"]');
    if (!clickable) return false;
    const text = norm(clickable.textContent || clickable.value || clickable.getAttribute("aria-label") || "");
    return text === "next";
  };

  const installCreateAccountNextGuard = () => {
    if (window[CREATE_ACCOUNT_GUARD_KEY]) return;
    window[CREATE_ACCOUNT_GUARD_KEY] = true;

    const guard = event => {
      try {
        if (!isCreateAccountScreenNow()) return;
        if (event.isTrusted) return; // real mouse/keyboard input from the user is allowed
        if (!isCreateAccountNextTarget(event.target)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.warn("[LSA MASTER] Blocked synthetic Next on Create an account. Waiting for user click.");
        setStatus('Create account ready — click Next manually to continue');
      } catch (err) {
        console.warn("[LSA MASTER] Create-account Next guard error", err);
      }
    };

    // Capture phase lets this guard run before Google or another enabled userscript.
    for (const type of ["pointerdown", "mousedown", "mouseup", "click", "keydown", "keyup"]) {
      document.addEventListener(type, guard, true);
    }

    console.log("[LSA MASTER] Create-account manual Next guard installed.");
  };

  installCreateAccountNextGuard();

  /* ----------------------------- Main cycle ----------------------------- */

  const cycle = async () => {
    const s = state();
    if (!s.active || stepRunning || Date.now() < retryAfter) return;
    stepRunning = true;
    try {
      await waitUntilVisible();
      const page = detectPage();
      switch (page) {
        case "eligibility":
          await handleEligibility();
          break;
        case "create-account":
          await handleCreateAccount();
          break;
        case "business-details":
          await handleBusinessDetails();
          break;
        case "service-area":
          await handleServiceArea();
          break;
        case "service-types":
          await handleServiceTypes();
          break;
        case "business-hours":
          await handleBusinessHours();
          break;
        case "preview":
          patchState({ active: false, completedAt: Date.now() });
          setStatus("Complete — reached Preview / confirmation");
          renderUI();
          break;
        default:
          setStatus("Waiting for the next LSA screen…");
      }
    } catch (err) {
      if (err?.isStageChange || err?.name === "StageChangedError") {
        console.log(`[LSA MASTER] Stage handoff: ${err.expected} → ${err.actual}. Old handler cancelled.`);
        setStatus(`Moved to ${err.actual} — continuing`);
        retryAfter = 0;
      } else {
        console.error("[LSA MASTER]", err);
        setStatus(`Needs review: ${err.message || err}`);
        retryAfter = Date.now() + 2500;
      }
    } finally {
      stepRunning = false;
      // If Google navigated while an old handler was unwinding, start the new
      // stage immediately instead of waiting for the next interval tick.
      setTimeout(cycle, 0);
    }
  };

  // Public helpers for debugging from the page console when needed.
  window.MARTINE_LSA_MASTER = {
    state: () => state(),
    stop: () => { patchState({ active: false }); renderUI(); },
    resume: () => { patchState({ active: true }); renderUI(); cycle(); },
    cycle,
    detectPage
  };

  const boot = () => {
    try {
      console.log("[LSA MASTER] Userscript booted", location.href);
      renderUI();
      cycle();
      setInterval(cycle, LOOP_MS);
    } catch (err) {
      console.error("[LSA MASTER] Startup error", err);
      const box = document.createElement("div");
      box.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:2147483647;background:#fff3cd;border:1px solid #f0ad4e;padding:12px;font:13px Arial;color:#202124;max-width:360px";
      box.textContent = "Martine LSA Master startup error: " + (err?.message || err);
      (document.body || document.documentElement).appendChild(box);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
