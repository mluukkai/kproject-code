const { Storage } = require('@google-cloud/storage');

const storage = new Storage({keyFilename: '/etc/secrets/key.json'});

const bucketName = 'mluukkai-project-bakcup-bucket';

async function createBucket() {
  await storage.createBucket(bucketName);
  console.log(`Bucket ${bucketName} created.`);
}

const filePath = '/usr/src/app/backup.sql';

const currentDate = new Date(); 
const formattedDate = currentDate.toISOString().split('T')[0]; 
const rnd = Math.floor(Math.random() * 1001);

const destFileName = `backup-${formattedDate}.sql`

async function createBucket() {
  const [ exists ] =  await storage.bucket(bucketName).exists()
  if (!exists) {
    await storage.createBucket(bucketName);
    console.log(`Bucket ${bucketName} created.`);
  }
}

async function uploadFile() {
  const options = {
    destination: destFileName,
    preconditionOpts: {
      ifGenerationMatch: 0
    },
  };

  await storage.bucket(bucketName).upload(filePath, options);
  console.log(`${filePath} uploaded to ${bucketName}`);
}

const main = async () => {
  await createBucket();
  await uploadFile();
};

main().catch(console.error);
