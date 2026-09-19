"""
Domain classification module for Hindi-Santali dataset records.
Assigns one of the 10 canonical domains based on keyword patterns in source text.
"""

import re
from typing import Dict, List

ALLOWED_DOMAINS = [
    "general",
    "conversation",
    "education",
    "agriculture",
    "healthcare",
    "government",
    "finance",
    "emergency",
    "rural",
    "technology"
]

DOMAIN_KEYWORDS: Dict[str, List[str]] = {
    "healthcare": [
        "स्वास्थ्य", "अस्पताल", "दवा", "चिकित्सा", "बीमारी", "डॉक्टर", "मरीज", "रोग", "इलाज",
        "वैक्सीन", "टीका", "टीकाकरण", "संक्रमण", "बुखार", "दर्द", "नर्स", "क्लिनिक", "कैंसर",
        "हार्ट", "रक्त", "खून", "आंख", "दांत", "दवाखाना", "उपचार"
    ],
    "agriculture": [
        "कृषि", "खेती", "फसल", "किसान", "बीज", "सिंचाई", "उर्वरक", "खाद", "धान", "गेहूं",
        "मक्का", "मिट्टी", "मानसून", "जुताई", "कटाई", "पौधा", "कीटनाशक", "उपज", "बागवानी",
        "मौसम", "बारिश", "वर्षा", "मृदा", "ट्रैक्टर", "खेत"
    ],
    "education": [
        "शिक्षा", "स्कूल", "विद्यालय", "कॉलेज", "विश्वविद्यालय", "छात्र", "शिक्षक", "अध्यापक",
        "परीक्षा", "पढ़ाई", "पुस्तक", "किताब", "कक्षा", "पाठशाला", "डिग्री", "विज्ञान",
        "गणित", "इतिहास", "ज्ञान", "अध्ययन", "शोध"
    ],
    "government": [
        "सरकार", "प्रशासन", "योजना", "अधिनियम", "कानून", "मंत्रालय", "अधिकारी", "न्यायालय",
        "पुलिस", "संविधान", "ग्राम पंचायत", "संसद", "चुनाव", "मतदान", "वोट", "नीति", "विभाग",
        "नागरिक", "अधिकार", "न्याय", "प्रमाणपत्र"
    ],
    "finance": [
        "बैंक", "ऋण", "लोन", "ब्याज", "पैसे", "रुपये", "बचत", "खाता", "बीमा", "पेंशन",
        "मुद्रा", "निवेश", "बाजार", "कीमत", "खर्च", "आय", "वेतन", "वित्तीय", "टैक्स", "कर"
    ],
    "emergency": [
        "आपातकाल", "खतरा", "दुर्घटना", "बाढ़", "भूकंप", "आग", "तूफान", "राहत", "बचाव",
        "एम्बुलेंस", "मदद", "चेतावनी", "संकट", "आपदा", "सुरक्षा", "घायल"
    ],
    "rural": [
        "गांव", "ग्रामीण", "पंचायत", "बस्ती", "तालाब", "कुआं", "पशुपालन", "गाय", "बैल",
        "बकरी", "हाट", "मेला", "झोपड़ी", "कुटीर", "लोहार", "बढ़ई", "चरवाहा"
    ],
    "technology": [
        "कंप्यूटर", "इंटरनेट", "मोबाइल", "सॉफ्टवेयर", "तकनीक", "डिजिटल", "वेबसाइट",
        "नेटवर्क", "ऑनलाइन", "साइबर", "एप्लिकेशन", "स्मार्टफोन", "डेटा", "मशीन", "उपग्रह"
    ],
    "conversation": [
        "नमस्ते", "आप", "तुम", "मैं", "हम", "क्या", "कैसे", "कहाँ", "कब", "धन्यवाद",
        "शुभ प्रभात", "शुभ रात्रि", "हालचाल", "अलविदा", "कृपया", "हां", "नहीं", "कहो",
        "बात", "सुनाओ", "बताओ"
    ]
}

def classify_domain(source_text: str, default_domain: str = "general") -> str:
    """
    Classifies source text into one of the 10 allowed domains.
    Defaults to 'general' if no distinct domain keywords match.
    """
    if not source_text:
        return default_domain

    scores = {}
    for domain, kws in DOMAIN_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in source_text)
        if score > 0:
            scores[domain] = score

    if not scores:
        return default_domain

    best_domain = max(scores.items(), key=lambda x: x[1])[0]
    return best_domain
