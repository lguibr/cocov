import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function showBanner(): Promise<void> {
  const assetPath = path.resolve(__dirname, '../../assets/ascii-art.txt');
  
  try {
    if (await fs.pathExists(assetPath)) {
      const art = await fs.readFile(assetPath, 'utf-8');
      console.log(chalk.cyan(art));
    } else {
        // Fallback or just ignore if asset missing in dist?
        // In dev, assets/ is in root. In dist, structure matches.
        // Try looking up from current location potentially.
        // If running from dist/utils/banner.js -> ../../assets/ascii-art.txt maybe
        // If not found, inline fallback to be safe
       const inline = `
                       .....:.  ..:... .::....                       
                  ...::..::..-----------..:::......                  
               ..--:.::::::---------------..::::.:--:.               
             ..---:.:::::.------------------- .::::..---..            
           .:----.::::::----------------------.::::::.:---:.          
         .:----.:::::::------------------------.:::::::.----:.        
       .:-----::::::::--------------------------.:::::::.-----..      
      .------:::::::::---------------------------::::::::.:-----.     
     .------:::::::::----------------------------.::::::::::-----.    
    .:------.::::::::-----------------------------::::::::::.------:.  
    :-------..::::::.----:.....::::::::::::..::----::::::::..:------:. 
   .---==+*******++++++.:::::::::::::::::::::::::.=+++++*******++=---. 
  .-=+****************::::::::::::::::::::::::::::.****************+=-.
  .=+++++++**********+:::::::::::::::::::::::::::::=**********++++++++:
       .......:=+****::::::::::::.......:::::::::::.****+=-:......     
                ..-++:::::.                   .:::::=+=..              
                    ..            ...             ...                  
    `;
    console.log(chalk.cyan(inline));
    }
  } catch (e) {
    // Silent fail
  }
  console.log(chalk.bold.cyan('\n🚀 Welcome to Cocov: The Code Coverage Gate\n'));
}
