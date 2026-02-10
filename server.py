import xml.etree.ElementTree as ET

sw_dictionary = {}

tree = ET.parse("dictionary.xml")
root = tree.getroot()
for word in root.findall("word"):
    value = word.get("value")
    word_class = word.get("class")
    comment = word.get("comment")
    lang = word.get("lang")
    translation_el = word.find("translation")
    translation = translation_el.get("value") if translation_el is not None else ""
    sw_dictionary[value] = {"class" : word_class, "comment" : comment,
        "language" : lang, "translation" : translation}
    if(word_class == "vb"):
        inflection_cont = word.find("paradigm")
        if inflection_cont is not None:
            inflections = inflection_cont.findall("inflection")
            for inflection in inflections:
                sw_dictionary[inflection.get("value")] = {"class" : word_class, "comment" : comment,
            "language" : lang, "translation" : translation}

