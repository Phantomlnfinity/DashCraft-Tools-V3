let game;
async function loadGame() {
	// fetch script
	const scriptUrl = 'https://dashcraft.io/remake/assets/index-aKhnHNjh.js';
	const scriptResponse = await fetch(scriptUrl);
	let scriptText = await scriptResponse.text();

	// fix asset urls
	scriptText = scriptText.replaceAll('import.meta.url', JSON.stringify(scriptUrl));

	// use gridSize variable instead of hardcoded 15
	scriptText = scriptText.replaceAll('15/2)/15)*15', 'gridSize/2)/gridSize)*gridSize'); // modify grid size x, z
	scriptText = scriptText.replace('this.level+', 'this.level+gridSize/15*') // modify grid size y
	scriptText = scriptText.replaceAll(/Math\.trunc\([^.]*\.[xyz]\/15\)/g, (match) => match.replace('Math.trunc', '') + '.toFixed(2)'); // add decimals to position display

	// add grid size option to menu
	let start = scriptText.slice(0, scriptText.indexOf(',{info:`A track with laps should only have a Start and not a Finish.`,')).lastIndexOf(',') - 2;
	let end = scriptText.indexOf('children:`+`') + 20;
	let menuSection = scriptText.slice(start, end);
	menuSection = menuSection.replace('laps-count', 'laps-count grid-size');
	menuSection = menuSection.replace('A track with laps should only have a Start and not a Finish.', 'Change grid size.'); // replace info
	menuSection = menuSection.replace('children:`LAPS`', 'children:`GRID SIZE`'); // replace label
	menuSection = menuSection.replaceAll(/[^.]\.addLaps\(/g, 'addGridSize('); // replace function name
	menuSection = menuSection.replace('children:i===1?`no laps`:i', 'children:gridSize');

	scriptText = scriptText.slice(0, end) + menuSection + scriptText.slice(end); // insert grid option
	console.log(menuSection);

	// define gridSize and addGridSize function
	scriptText += '\nlet gridSize = 15;';
	scriptText += '\nfunction addGridSize(change) { let values = [1, 3, 5, 15, 30]; gridSize = values[Math.min(Math.max(values.indexOf(gridSize) + change, 0), values.length - 1)]; document.querySelector(".grid-size").textContent = gridSize; }';

	console.log(scriptText);

	// inject modified script
	let scriptElement = document.createElement('script');
	scriptElement.type = 'module';
	scriptElement.textContent = scriptText;
	document.head.appendChild(scriptElement);
}
loadGame();