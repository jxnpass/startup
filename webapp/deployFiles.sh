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

printf "\n----> Deploying React bundle $service to $hostname with $key\n"

# Step 1
printf "\n----> Build the distribution package\n"
rm -rf build
mkdir -p build

npm install
npm run build

# Copy package files needed for npm install on the server
cp package.json build
if [[ -f package-lock.json ]]; then
    cp package-lock.json build
fi

# Copy the whole backend folder, including index.js, public, data, etc.
cp -r service build/service

# Step 2
printf "\n----> Clearing out previous distribution on the target\n"
ssh -i "$key" ubuntu@$hostname << ENDSSH
rm -rf services/${service}
mkdir -p services/${service}
ENDSSH

# Step 3
printf "\n----> Copy the distribution package to the target\n"
scp -r -i "$key" build/* ubuntu@$hostname:services/$service

# Step 4
printf "\n----> Deploy the service on the target\n"
ssh -i "$key" ubuntu@$hostname << ENDSSH
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
nvm use node >/dev/null 2>&1 || true

cd services/${service}
npm install --omit=dev

pm2 describe ${service} > /dev/null 2>&1
if [ \$? -eq 0 ]; then
    pm2 restart ${service} --update-env
else
    pm2 start npm --name "${service}" -- start
fi
ENDSSH

# Step 5
printf "\n----> Removing local copy of the distribution package\n"
rm -rf build