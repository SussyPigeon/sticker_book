import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import "./App.css";
import { StickerPicker } from "./components/sticker/sticker-picker";
import { initDatabase } from "./lib/database";
import { initStickerStorage } from "./lib/stickers";

function App() {
	useEffect(() => {
		const init = async () => {
			await initDatabase();
			await initStickerStorage();
		};
		init();
	}, []);

	return (
		<div className="flex h-screen font-family-sans">
			{/* Sidebar */}
			<div className="w-60 bg-gray-800 flex flex-col">
				<div className="h-12 px-4 flex items-center border-b border-gray-900 shadow-md">
					<h1 className="text-white font-bold">My Tauri App</h1>
				</div>
				<div className="flex-1 overflow-y-auto p-2">
					{/* Navigation items */}
					<button
						className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-750 text-gray-400 hover:text-gray-100 transition-colors"
						type="button"
					>
						Home
					</button>
					<button
						className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-750 text-gray-400 hover:text-gray-100 transition-colors"
						type="button"
					>
						Settings
					</button>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 bg-gray-800 flex flex-col">
				<div className="h-12 px-4 flex items-center border-b border-gray-900 shadow-md">
					<h2 className="text-white font-semibold">Welcome</h2>
				</div>
				<div className="flex-1 overflow-y-auto p-6">
					<div className="max-w-2xl">
						<h2 className="text-2xl font-bold text-white mb-4">
							Getting Started
						</h2>
						<p className="text-gray-300 mb-6">
							Your Tauri app with Discord-inspired design is ready!
						</p>
						<div className="flex gap-3">
							<Button variant="primary">Primary Action</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="success">Success</Button>
							<Button variant="danger">Danger</Button>
							<Button variant="ghost">Ghost</Button>
						</div>
						<br />
						<div className="flex gap-2">
							<Button variant="primary" size="sm">
								sm
							</Button>
							<Button variant="primary" size="md">
								md
							</Button>
							<Button variant="primary" size="lg">
								lg
							</Button>
						</div>

						<br />
						<StickerPicker />
					</div>
				</div>
			</div>
		</div>
	);
}

// function App() {
//   const [greetMsg, setGreetMsg] = useState("");
//   const [name, setName] = useState("");
//
//   async function greet() {
//     // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
//     setGreetMsg(await invoke("greet", { name }));
//   }
//
//   return (
//     <main className="container">
//       <h1>Welcome to Tauri + React</h1>
//
//       <div className="row">
//         <a href="https://vite.dev" target="_blank">
//           <img src="/vite.svg" className="logo vite" alt="Vite logo" />
//         </a>
//         <a href="https://tauri.app" target="_blank">
//           <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <p>Click on the Tauri, Vite, and React logos to learn more.</p>
//
//       <form
//         className="row"
//         onSubmit={(e) => {
//           e.preventDefault();
//           greet();
//         }}
//       >
//         <input
//           id="greet-input"
//           onChange={(e) => setName(e.currentTarget.value)}
//           placeholder="Enter a name..."
//         />
//         <button type="submit">Greet</button>
//       </form>
//       <p>{greetMsg}</p>
//     </main>
//   );
// }

export default App;
