# Kanji reading sources

The N2 Soumatome import in `migrations/n2-soumatome-catalog.json` also uses the
locally available KANJIDIC2 XML for character on/kun readings and stroke counts.
It retains dictionary prefix/suffix hyphens, removes okurigana separator dots,
deduplicates readings, and excludes name readings. These character readings may
include readings beyond those printed in the textbook. The same EDRDG attribution
and CC BY-SA 4.0 terms below apply to this derived reading data.
Myanmar character meanings and supplementary study-word selections were added
for this app. The original scanned textbook pages are user-supplied reference
material and are not covered by the dictionary licence.

The character readings in `src/kanjiReadings.json` are derived from
[KANJIDIC](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project), copyright
James William BREEN and the Electronic Dictionary Research and Development Group,
via [David Gouveia's kanji-data](https://github.com/davidluzgouveia/kanji-data).

The derived reading data is distributed under
[Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
See the [EDRDG dictionary licence](https://www.edrdg.org/edrdg/licence.html)
and [KANJIDIC documentation](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project).

Changes: selected the characters used on Chapter 1–7 flashcards; converted on
readings to katakana; removed okurigana separator dots; deduplicated readings;
retained the approved textbook kun readings for 起. Dictionary readings can include
uncommon readings; they are character readings, not pronunciations of entire words.
Hyphens retain the dictionary's prefix/suffix notation. No name readings are imported.

The runtime fallback is extracted from the character readings already stored in
`migrations/n3-catalog.json`, with the requested readings for the character U+8D77.

## kanji-data MIT licence

Copyright (c) 2019 David Gouveia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
