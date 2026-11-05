const extensionVersion = "0.1.0\n7\n";
let game;

String.prototype.insert = function(index, string) {
	return this.slice(0, index) + string + this.slice(index);
};

async function loadGame() {
	// fetch script
	await new Promise(resolve => addEventListener('DOMContentLoaded', resolve));
	const scriptUrl = document.querySelector("script").src;
	const scriptResponse = await fetch(scriptUrl);
	let scriptText = await scriptResponse.text();

	// fix asset urls
	scriptText = scriptText.replaceAll('import.meta.url', JSON.stringify(scriptUrl));

	// use gridSize variable instead of hardcoded 15
	scriptText = scriptText.replaceAll('15/2)/15)*15', 'gridSize/2)/gridSize)*gridSize'); // modify grid size x, z
	scriptText = scriptText.replace(/(\+!![^-]*-\+!![^)]*)/, '($1)*gridSize/15'); // modify grid size y
	scriptText = scriptText.replaceAll(/Math\.trunc\(([^.])*\.([xyz])\/15\)/g, '($1.$2/15).toFixed(2)'); // add decimals to position display
	scriptText = scriptText.replace(/children:\[`Level `,([^]]*)\]/, 'children:[`Level `,$1.toFixed(2)]'); // replace level children with grid size

	// define gridSize and addGridSize function
	scriptText += '\nlet gridSize = 15;';
	scriptText += '\nfunction addGridSize(change) { let values = [1, 3, 5, 15, 30]; gridSize = values[Math.min(Math.max(values.indexOf(gridSize) + change, 0), values.length - 1)]; document.querySelector(".grid-size").textContent = gridSize; }';

	// add grid size option to menu
	let start = scriptText.slice(0, scriptText.indexOf(',{info:`A track with laps should only have a Start and not a Finish.`,')).lastIndexOf(',') - 2;
	let end = scriptText.indexOf('children:`+`') + 20;
	let menuSection = scriptText.slice(start, end);
	menuSection = menuSection.replace('laps-count', 'laps-count grid-size'); // add grid size class
	menuSection = menuSection.replace('A track with laps should only have a Start and not a Finish.', 'Change grid size.'); // replace info
	menuSection = menuSection.replace('children:`LAPS`', 'children:`GRID SIZE`'); // replace label
	menuSection = menuSection.replaceAll(/[^.]\.addLaps\(/g, 'addGridSize('); // replace function name
	menuSection = menuSection.replace('children:i===1?`no laps`:i', 'children:gridSize'); // switch value
	scriptText = scriptText.insert(end, menuSection); // insert grid option
	console.log(menuSection);

	// function exports
	let messageFunction = scriptText.match(/function (\w+)\(\w+,\w+\){let \w+=\w+\+\+;/)[1]; // message function
	scriptText += `const message = ${messageFunction};`;
	scriptText += 'export {message};';
	

	console.log(scriptText);

	// inject modified script
	let scriptElement = document.createElement('script');
	scriptElement.type = 'module';
	document.head.appendChild(scriptElement);
	scriptElement.src = URL.createObjectURL(
    	new Blob([scriptText], { type: 'text/javascript' })
	);

	// import functions from game
	game = await import(scriptElement.src);


	// check if game has updated
	fetch("https://dashcraft.io/remake/version.txt?t=" + Date.now())
		.then(response => response.text())
		.then(version => {
			let [main, sub] = version.split('\n');
			if (version !== extensionVersion) {
				game.message('error', `DashCraft Tools has not been updated for version ${main} (${sub}), so some mods may not work correctly.`);
			} else {
				game.message('success', `DashCraft Tools loaded.`);
			}
		});
}
loadGame();