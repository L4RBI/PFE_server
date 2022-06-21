from PIL import Image
import torch
from torchvision.utils import save_image
from torchvision import transforms
import sys
# chooses what model to train
from resUnet import Generator
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def load_checkpoint(checkpoint_file, model):
    print("=> Loading checkpoint")
    checkpoint = torch.load(checkpoint_file, map_location=DEVICE)
    model.load_state_dict(checkpoint["state_dict"])


transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])


def main():
    gen = Generator(init_weight=False).to(DEVICE)
    x = Image.open(sys.argv[1])
    x = transform(x).unsqueeze_(0).to(DEVICE)
    print(x.shape)
    print(sys.argv[2])
    load_checkpoint(sys.argv[2], gen)
    gen.eval()

    with torch.no_grad():
        y_fake = gen(x)
    save_image(x * 0.5 + 0.5, sys.argv[1])
    save_image(y_fake * 0.5 + 0.5, sys.argv[3])


if __name__ == "__main__":
    main()
