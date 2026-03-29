while getopts k:h:s: flag
do
    case "${flag}" in
        k) key=${OPTARG};;
        h) hostname=${OPTARG};;
        s) service=${OPTARG};;
    esac
done

if [[ -z "$key" || -z "$hostname" || -z "$service" ]]; then
    printf "\nMissing required parameter.\n"
    printf "  syntax: deployFiles.sh -k <pem key file> -h <hostname> -s <service>\n\n"
    exit 1
fi

set -e

printf "\n----> Deploying React bundle %s to %s with %s\n" "$service" "$hostname" "$key"

# Step 1
printf "\n----> Build the distribution package\n"
rm -rf build
mkdir -p build/public

npm install
npm run build

cp -rf dist/* build/public/
cp service/*.js build/
cp service/*.json build/

# Step 2
printf "\n----> Clearing out previous distribution on the target\n"
ssh -i "$key" ubuntu@"$hostname" "
  rm -rf ~/services/${service} &&
  mkdir -p ~/services/${service}
"

# Step 3
printf "\n----> Copy the distribution package to the target\n"
scp -r -i "$key" build/* ubuntu@"$hostname":~/services/"$service"/

# Step 4
printf "\n----> Deploy the service on the target\n"
ssh -i "$key" ubuntu@"$hostname" "
  cd ~/services/${service} &&
  npm ci --omit=dev &&
  pm2 describe ${service} > /dev/null 2>&1 &&
  pm2 restart ${service} ||
  pm2 start index.js --name ${service}
"

# Step 5
printf "\n----> Removing local copy of the distribution package\n"
rm -rf build
rm -rf dist

printf "\n----> Deployment complete\n"