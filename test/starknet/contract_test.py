import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
import pytest

from starkware.starknet.testing.starknet import Starknet

# The path to the contract source code.
CONTRACT_FILE = "contracts/starknet/contract.cairo"

# The testing library uses python's asyncio. So the following decorator and the 'async' keyword are needed.
@pytest.mark.asyncio
async def test_increase_balance():
    # Create a new Starknet class that simulates the StarkNet system.
    starknet = await Starknet.empty()

    # Deploy the contract.
    contract = await starknet.deploy(
        source=CONTRACT_FILE,
        constructor_calldata=[10]
    )

    # Invoke increase_balance() twice.
    await contract.increase_balance(amount=10).invoke()
    await contract.increase_balance(amount=20).invoke()

    # Check the result of get_balance().
    execution_info = await contract.get_balance().call()
    assert execution_info.result == (40,)
