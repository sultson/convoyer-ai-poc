export async function extractVehicleData({vehicleId}: {vehicleId: string}) {
    const url = `https://www.militaryfactory.com/armor/detail.php?armor_id=${vehicleId}`;
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
  
    const data = {};
  
    // Helper function to extract text content and handle optional values
    function extractText(selector, optional = false) {
      const element = doc.querySelector(selector);
      return element ? element.textContent.trim() : (optional ? null : "");
    }
  
    data.name = extractText('h1 .textBold');
    data.type = extractText('h2');
    data.origin = extractText('h3', true)?.split('|')[0].trim();
    data.year = extractText('h3',true)?.split('|')[1].trim().split('/')[2];
    data.description = extractText('h4');
  
  
    data.power_and_performance = {};
    data.power_and_performance.engine = extractText('.specContainerMain:nth-of-type(1) > span:nth-of-type(1)');
    data.power_and_performance.horsepower = extractText('.specContainerMain:nth-of-type(1) > span:nth-of-type(1)').match(/\d+ horsepower/)?.[0].replace(' horsepower','');
  
    data.power_and_performance.drive_arrangement = extractText('.specContainerMain:nth-of-type(1) > span:nth-of-type(1)').match(/\d+x\d+ wheeled/)?.[0];
  
  
    data.power_and_performance.road_speed = extractText('.specContainerShort:nth-of-type(1) span:nth-of-type(3)');
    data.power_and_performance.range = extractText('.specContainerShort:nth-of-type(2) span:nth-of-type(3)');
  
  
  
    data.structure = {};
    data.structure.crew = extractText('.specContainerShort:nth-of-type(1) span:nth-of-type(1)',true);
    data.structure.length = extractText('.specContainerShort:nth-of-type(2) span:nth-of-type(3)');
    data.structure.width = extractText('.specContainerShort:nth-of-type(3) span:nth-of-type(3)');
    data.structure.height = extractText('.specContainerShort:nth-of-type(4) span:nth-of-type(3)');
    data.structure.weight = extractText('.specContainerShort:nth-of-type(5) span:nth-of-type(3)');
  
    data.armament = {};
    data.armament.optional = Array.from(doc.querySelectorAll('.specContainerMain:nth-of-type(1) .textNormal')).map(e => e.textContent.trim().replace('OPTIONAL:', '').replace(/Also any personal weapons.*/,''));
    data.armament.mounting = extractText('.specContainerMain:nth-of-type(1) .textNormal').match(/in .*/)?.[0].replace('in ', '').replace('.', '');
  
    //Ammunition section parsing
     const ammunitions = extractText('.specContainerMain:nth-of-type(2) .textNormal',true).split('\n');
  
    data.armament.ammunition = {};
    for (const ammo of ammunitions) {
      const match = ammo.match(/(\d+) x ([\d.]+mm)/);
      if (match) {
        data.armament.ammunition[match[2]] = match[1] + " rounds";
      }
    }
  
    data.armament.special_equipment = {};
    const specialEquipment = Array.from(doc.querySelectorAll('.specContainerMain:nth-of-type(3) .textNormal')).map(e => e.textContent.trim().replace('SPECIAL EQUIPMENT:\n', '').split('\n'));
    const specialEquipmentList = specialEquipment.flat().map(item => item.split(' - '));
    specialEquipmentList.forEach(([equipment, value]) => {
      data.armament.special_equipment[equipment.toLowerCase().replace(/\s/g, '_')] = value.toLowerCase() === 'yes';
    });
  
    data.variants = {};
    const variants = Array.from(doc.querySelectorAll('.specContainerMain:nth-of-type(1) .textNormal',true)).map(e=>e.textContent.trim().split('\n'));
    const variantsList = variants.flat().filter(e=> !e.includes('Series Designation') && e.length > 0);
    variantsList.forEach(variant =>{
        const [name,description] = variant.split(' - ');
        data.variants[description ? description.toLowerCase().replace(' ','_') : "base"] = name;
    })
  
    data.operators = Array.from(doc.querySelectorAll('.rightCol .textNormal a img')).map(img => img.alt.replace('National flag of ', ''));
  
  
      data.production = {};
       data.production.total = extractText('.rightCol .textDkGray span:nth-of-type(1)').match(/\d+ Units/)?.[0].replace(' Units','');
       data.production.contractor = extractText('.rightCol .textDkGray span:nth-of-type(3)').match(/:.*/)?.[0].replace(': ','');
  
    return data;
  }
  
  
  // Example usage:
  const url = 'https://www.militaryfactory.com/armor/detail.php?armor_id=1211'; // Replace with your URL
  
  extractVehicleData(url)
    .then(data => {
      console.log(JSON.stringify(data, null, 2)); 
    })
    .catch(error => {
      console.error("Error fetching or parsing data:", error);
    });
