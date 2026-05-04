const fs = require('fs');
const path = require('path');

const urlMap = {
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186857/Digestive_System_xepxba.glb': '/models/Digestive System.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186857/Digestive_System_01_xlfmzv.glb': '/models/Digestive System_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186856/Skull_yqxdjz.glb': '/models/Skull.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186856/Three_Boxes_mqbbxs.glb': '/models/Three Boxes.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186856/Stomach_01_mfzkdw.glb': '/models/Stomach_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186855/Rectum_01_lhlw8d.glb': '/models/Rectum_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186855/Mouth_01_cjsjmj.glb': '/models/Mouth_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186854/Anus_01_fkggnd.glb': '/models/Anus_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186854/Pharynx_01_qtg9l4.glb': '/models/Pharynx_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186854/Large_intestine_01_bphjog.glb': '/models/Large_intestine_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186854/Liver_01_nudfr5.glb': '/models/Liver_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186852/Pancreas_01_wume8m.glb': '/models/Pancreas_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186852/Small_Intestine_01_ck5xip.glb': '/models/Small_Intestine_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186852/Esophagus_01_mlruqs.glb': '/models/Esophagus_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186852/Gallbladder_01_oeyod3.glb': '/models/Gallbladder_01.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186854/Rotten_Brain_dwdapf.glb': '/models/Rotten Brain.glb',
    'https://res.cloudinary.com/dy1gyundx/raw/upload/v1777186853/heart_xf4zgf.glb': '/models/heart.glb'
};

const files = [
  'src/data.js',
  'src/components/InteractiveDigestiveView.jsx',
  'src/components/InteractiveDigestiveView_v1.jsx',
  'src/components/InteractiveDigestiveView_v2.jsx',
  'src/components/HumanAnatomyDigestiveView.jsx',
  'src/components/InteractiveTestView.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [badUrl, localUrl] of Object.entries(urlMap)) {
        if (content.includes(badUrl)) {
            content = content.split(badUrl).join(localUrl);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Reverted ${file}`);
    }
});
