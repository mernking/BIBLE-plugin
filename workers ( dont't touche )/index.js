const fs = require('fs');
const path = require('path');

const hymns1Path = path.join(__dirname, 'hymns.json');
const hymns2Path = path.join(__dirname, 'hymn2.json');
const outputPath = path.join(__dirname, 'merged_hymns.json');

try {
  // Read the files
  const hymns1Data = fs.readFileSync(hymns1Path, 'utf8');
  const hymns2Data = fs.readFileSync(hymns2Path, 'utf8');

  // Parse the JSON data
  const hymns1 = JSON.parse(hymns1Data);
  const hymns2Object = JSON.parse(hymns2Data).hymns;

  // Convert hymns2 object to an array
  const hymns2 = Object.values(hymns2Object);

  let mergedHymns = [];

  // Process hymns from hymns.json
  hymns1.forEach(hymn => {
    mergedHymns.push({
      title: hymn.title,
      author: hymn.author,
      meter: hymn.meter,
      tuneName: hymn.tuneName,
      verses: hymn.verses.map(verse => verse.join('\n')),
      chorus: hymn.chorus.join('\n'),
      addedChorus: hymn.addedChorus.join('\n'),
      sourceFile: 'hymns.json'
    });
  });

  // Process hymns from hymn2.json
  hymns2.forEach(hymn => {
    mergedHymns.push({
      title: hymn.title,
      titleWithHymnNumber: hymn.titleWithHymnNumber,
      chorus: typeof hymn.chorus === 'string' ? hymn.chorus : '',
      verses: hymn.verses,
      sound: hymn.sound,
      category: hymn.category,
      sourceFile: 'hymn2.json'
    });
  });

  // Filter out duplicates by title, keeping the first occurrence
  const uniqueHymns = [];
  const seenTitles = new Set();

  mergedHymns.forEach(hymn => {
    if (!seenTitles.has(hymn.title)) {
      uniqueHymns.push(hymn);
      seenTitles.add(hymn.title);
    }
  });

  // Renumber all hymns for consistency
  const finalHymns = uniqueHymns.map((hymn, index) => {
    return {
      number: index + 1,
      ...hymn
    };
  });

  // Write the merged and numbered hymns to a new file
  fs.writeFileSync(outputPath, JSON.stringify(finalHymns, null, 2), 'utf8');

  console.log(`Successfully merged ${finalHymns.length} unique hymns into ${outputPath}`);

} catch (error) {
  console.error("An error occurred:", error);
}
