# image-gallary

To get started copy php/.config.dist.inc.php to php/.config.inc.php and .env.dist to .env

edit both .env and .config.inc.php add a salt and key for imgproxy's url signing (these should match between both files). This can be generated with echo $(xxd -g 2 -l 64 -p /dev/random | tr -d '\n')

edit .env and update the local directory that your images reside in

docker-compose up -d