// All SDK level constants will be exported from here

// Backlight Toggle URL TOGGLE
const BACKLIGHT_URL = "https://webbacklight.web.app/?mode=";

// Backlight mode enum
const BacklightMode = Object.freeze({"OFF":"2D", "ON":"3D"});

// Available devices
const DeviceIds = ["LPD-10W", "H1A1000"]

// Device id to config map
const DeviceIdConfigMap = Object.freeze({"LPD-10W":"LUMEPAD", "H1A1000":"HYDROGEN"});

// Available configs
const DisplayConfigs = Object.freeze({
    // CONFIG 1 : LUMEPAD
    "LUMEPAD": {
        "stringParams": [
        ],
        "intParams": [
            {
                "Name": "PanelResolution",
                "Collection": [
                    2560,
                    1600
                ]
            },
            {
                "Name": "NumViews",
                "Collection": [
                    4,
                    4
                ]
            },
            {
                "Name": "DisplaySizeInMm",
                "Collection": [
                    0,
                    0
                ]
            },
            {
                "Name": "ViewResolution",
                "Collection": [
                    640,
                    400
                ]
            }
        ],
        "boolParams": [
            {
                "Name": "Slant",
                "Collection": [
                    true
                ]
            },
            {
                "Name": "isSquare",
                "Collection": [
                    false
                ]
            },
            {
                "Name": "isSlanted",
                "Collection": [
                    true
                ]
            }
        ],
        "floatParams": [
            {
                "Name": "ResolutionScale",
                "Collection": [
                    1.0
                ]
            },
            {
                "Name": "InterlacingMatrixLandscape",
                "Collection": [
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    640,
                    0,
                    0,
                    0
                ]
            },
            {
                "Name": "InterlacingMatrixLandscape180",
                "Collection": [
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    640,
                    0,
                    0,
                    0
                ]
            },
            {
                "Name": "InterlacingMatrixPortrait",
                "Collection": [
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    400,
                    0,
                    0,
                    0
                ]
            },
            {
                "Name": "InterlacingMatrixPortrait180",
                "Collection": [
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    400,
                    0,
                    0,
                    0
                ]
            },
            {
                "Name": "InterlacingVectorLandscape",
                "Collection": [
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "InterlacingVectorLandscape180",
                "Collection": [
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "InterlacingVectorPortrait",
                "Collection": [
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "InterlacingVectorPortrait180",
                "Collection": [
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "Gamma",
                "Collection": [
                    2.200000047683716
                ]
            },
            {
                "Name": "Beta",
                "Collection": [
                    1.399999976158142
                ]
            },
            {
                "Name": "DotPitchInMm",
                "Collection": [
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "AlignmentOffset",
                "Collection": [
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "ActCoefficientsY",
                "Collection": [
                    0.032000000000000000,
                    0.019999999552965165
                ]
            },
            {
                "Name": "ActCoefficientsX",
                "Collection": [
                    0.05000000000000000,
                    0.01500000000000000
                ]
            },
            {
                "Name": "SystemDisparityPercent",
                "Collection": [
                    0.012500000186264515
                ]
            },
            {
                "Name": "SystemDisparityPixels",
                "Collection": [
                    8.0
                ]
            }
        ]
    },
    // CONFIG 2 : HYDROGEN
    "HYDROGEN" : {
        "stringParams": [
        ],
        "intParams": [
            {
                "Name": "PanelResolution",
                "Collection": [
                    2560,
                    1440
                ]
            },
            {
                "Name": "NumViews",
                "Collection": [
                    4,
                    4
                ]
            },
            {
                "Name": "DisplaySizeInMm",
                "Collection": [
                    0,
                    0
                ]
            },
            {
                "Name": "ViewResolution",
                "Collection": [
                    640,
                    360
                ]
            }
        ],
        "boolParams": [
            {
                "Name": "Slant",
                "Collection": [
                    true
                ]
            },
            {
                "Name": "isSquare",
                "Collection": [
                    false
                ]
            },
            {
                "Name": "isSlanted",
                "Collection": [
                    true
                ]
            }
        ],
        "floatParams": [
            {
                "Name": "ResolutionScale",
                "Collection": [
                    1.0
                ]
            },
            {
                "Name": "InterlacingMatrixLandscape",
                "Collection": [
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    640,
                    0,
                    0,
                    0
                ]
            },
            {
                "Name": "InterlacingMatrixLandscape180",
                "Collection": [
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    640,
                    0,
                    0,
                    0
                ]
            },
            {
                "Name": "InterlacingMatrixPortrait",
                "Collection": [
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    360,
                    0,
                    0,
                    0
                ]
            },
            {
                "Name": "InterlacingMatrixPortrait180",
                "Collection": [
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    360,
                    0,
                    0,
                    0
                ]
            },
            {
                "Name": "InterlacingVectorLandscape",
                "Collection": [
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "InterlacingVectorLandscape180",
                "Collection": [
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "InterlacingVectorPortrait",
                "Collection": [
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "InterlacingVectorPortrait180",
                "Collection": [
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "Gamma",
                "Collection": [
                    2.200000047683716
                ]
            },
            {
                "Name": "Beta",
                "Collection": [
                    1.399999976158142
                ]
            },
            {
                "Name": "DotPitchInMm",
                "Collection": [
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "AlignmentOffset",
                "Collection": [
                    0.0,
                    0.0
                ]
            },
            {
                "Name": "ActCoefficientsY",
                "Collection": [
                    0.040000000000000000,
                    0.019999999552965165
                ]
            },
            {
                "Name": "ActCoefficientsX",
                "Collection": [
                    0.03500000387430191,
                    0.06000000000000000
                ]
            },
            {
                "Name": "SystemDisparityPercent",
                "Collection": [
                    0.012500000186264515
                ]
            },
            {
                "Name": "SystemDisparityPixels",
                "Collection": [
                    8.0
                ]
            }
        ]
    }
})


module.exports = {
    BACKLIGHT_URL: BACKLIGHT_URL,
    BacklightMode: BacklightMode,
    DisplayConfigs: DisplayConfigs,
    DeviceIds, DeviceIds,
    DeviceIdConfigMap: DeviceIdConfigMap
}
