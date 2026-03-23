#!/bin/bash

# Production Deployment Script
# Kullanım: ./deploy.sh [railway|vercel|docker]

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# Check required tools
check_dependencies() {
  print_success "Checking dependencies..."

  if ! command -v node &> /dev/null; then
    print_error "Node.js is required"
    exit 1
  fi

  if ! command -v npm &> /dev/null; then
    print_error "npm is required"
    exit 1
  fi

  print_success "All dependencies installed"
}

# Generate secure secret
generate_secret() {
  print_success "Generating WIDGET_SECRET..."
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo "$SECRET"
}

# Deploy to Railway
deploy_railway() {
  print_success "Deploying to Railway..."

  if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. Installing..."
    npm i -g @railway/cli
  fi

  railway login

  print_success "Creating Railway project..."
  railway init --yes

  print_success "Setting environment variables..."
  railway variables set SUPABASE_URL="$SUPABASE_URL"
  railway variables set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY"
  railway variables set WIDGET_SECRET="$WIDGET_SECRET"
  railway variables set PORT=3001
  railway variables set NODE_ENV=production

  print_success "Deploying to Railway..."
  railway up

  DOMAIN=$(railway domain | grep -oP '(?<=on )(.*)(?=\.railway\.app)')
  print_success "API deployed to: https://${DOMAIN}.railway.app"
  print_success "Widget URL: https://${DOMAIN}.railway.app/widget.js"
}

# Deploy to Vercel
deploy_vercel() {
  print_success "Deploying to Vercel..."

  if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm i -g vercel
  fi

  print_success "Building admin panel..."
  npm run build

  print_success "Deploying to Vercel..."
  vercel --prod

  print_success "Admin panel deployed!"
}

# Deploy with Docker
deploy_docker() {
  print_success "Deploying with Docker..."

  if ! command -v docker &> /dev/null; then
    print_error "Docker is required"
    exit 1
  fi

  print_success "Building Docker images..."
  docker-compose -f docker-compose.production.yml build

  print_success "Starting containers..."
  docker-compose -f docker-compose.production.yml up -d

  print_success "Deployed locally!"
  print_warning "Configure nginx reverse proxy for production domain"
}

# Main deployment flow
main() {
  echo -e "${GREEN}"
  echo "╔══════════════════════════════════════╗"
  echo "║   Çarkıfelek Production Deploy     ║"
  echo "╚══════════════════════════════════════╝"
  echo -e "${NC}"

  check_dependencies

  # Load environment variables
  if [ -f .env.production ]; then
    print_success "Loading .env.production..."
    export $(cat .env.production | grep -v '^#' | xargs)
  else
    print_error ".env.production not found!"
    print_warning "Creating from template..."

    SECRET=$(generate_secret)

    cat > .env.production << EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
WIDGET_SECRET=$SECRET
WIDGET_API_PORT=3001
NODE_ENV=production
EOF

    print_warning "Please update .env.production with your values"
    exit 1
  fi

  # Check WIDGET_SECRET
  if [ "$WIDGET_SECRET" = "CHANGE_THIS_TO_A_SECURE_32_CHAR_STRING" ]; then
    print_error "Please change WIDGET_SECRET in .env.production"
    SECRET=$(generate_secret)
    print_warning "Generated secret: $SECRET"
    exit 1
  fi

  # Deploy based on argument
  case "${1:-}" in
    railway)
      deploy_railway
      ;;
    vercel)
      deploy_vercel
      ;;
    docker)
      deploy_docker
      ;;
    all)
      deploy_railway
      deploy_vercel
      ;;
    *)
      echo "Usage: $0 [railway|vercel|docker|all]"
      echo ""
      echo "Options:"
      echo "  railway   - Deploy API server to Railway"
      echo "  vercel    - Deploy admin panel to Vercel"
      echo "  docker    - Deploy locally with Docker"
      echo "  all       - Deploy both Railway + Vercel"
      exit 1
      ;;
  esac

  print_success "Deployment complete!"
}

main "$@"
